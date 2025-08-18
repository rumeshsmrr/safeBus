import Header from "@/app/Components/header";
import { auth, db } from "@/app/lib/firebase";
import { images } from "@/constants/images";
import { getApprovedBusForChild } from "@/data/busChildren";
import {
  resolveBusDocId,
  subscribeBusProfileById,
  type BusProfile,
} from "@/data/busProfiles";
import { dateKeyFor, type TourSession, type TourStatus } from "@/data/tours";
import { getUserById } from "@/data/users";

import { createEmergencyAlert } from "@/data/emergency";
import type { UserDoc as BaseUserDoc } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type Region,
} from "react-native-maps";

import {
  subscribeChildLiveLocation,
  type ChildLiveLocation,
} from "@/data/liveLocation";
import {
  startSharingLocation,
  stopSharingLocation,
} from "@/data/locationPublisher";

/* ------------ Local augmented type so child.status compiles ------------ */
type UserDoc = BaseUserDoc & {
  status?: "Dropped" | "AB" | "Not Going" | "Pick In" | "On Bus" | "Unknown";
};

const scrollViewBottomPadding = 100;

const statusChipStyle = (status: string) => {
  switch (status) {
    case "Pick In":
      return { bg: "#DBEAFE", fg: "#1E40AF" };
    case "On Bus":
      return { bg: "#FFF2C6", fg: "#7A5C00" };
    case "Dropped":
      return { bg: "#DAFADD", fg: "#0B5D1E" };
    case "AB":
      return { bg: "#FCD9D9", fg: "#7C1D1D" };
    case "Not Going":
      return { bg: "#FCE7F3", fg: "#9D174D" };
    default:
      return { bg: "#EAEAEA", fg: "#444" };
  }
};

const labelForTourStatus = (s?: TourStatus | null): string | undefined => {
  switch (s) {
    case "PICK_IN":
      return "Pick In";
    case "ON_BUS":
      return "On Bus";
    case "DROPPED":
      return "Dropped";
    case "ABSENT":
      return "AB";
    case "NOT_GOING":
      return "Not Going";
    default:
      return undefined;
  }
};

function timeAgo(d?: Date | null) {
  if (!d) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  return `${day}d ago`;
}

const DEFAULT_REGION: Region = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05 * (9 / 16),
};

const ChildHome = () => {
  // UI state
  const [notifyDriverModalVisible, setNotifyDriverModalVisible] =
    useState(false);
  const [notifyParentModalVisible, setNotifyParentModalVisible] =
    useState(false);
  const [message, setMessage] = useState("");

  // Share toggle
  const [sharing, setSharing] = useState(false);

  // Data state
  const [child, setChild] = useState<UserDoc | null>(null);
  const [parent, setParent] = useState<UserDoc | null>(null);

  // Connected bus (live) for this child
  const [bus, setBus] = useState<(BusProfile & { id: string }) | null>(null);
  const busUnsubRef = useRef<undefined | (() => void)>(undefined);

  // Live tour status (today + current session) for this child
  const [tourStatus, setTourStatus] = useState<TourStatus | null>(null);
  const statusUnsubRef = useRef<undefined | (() => void)>(undefined);

  // Child last/real-time location
  const [liveLoc, setLiveLoc] = useState<ChildLiveLocation>(null);
  const liveUnsubRef = useRef<undefined | (() => void)>(undefined);

  // Today/session
  const [dateKey] = useState<string>(() => dateKeyFor());
  const currentSession: TourSession = useMemo(
    () => (new Date().getHours() < 12 ? "morning" : "evening"),
    []
  );

  const [sendingSOS, setSendingSOS] = useState(false);
  async function onEmergencyHold() {
    if (!child?.uid || !parent?.uid) {
      alert("Missing parent/child link.");
      return;
    }
    if (sendingSOS) return;
    try {
      setSendingSOS(true);
      await createEmergencyAlert({
        childUid: child.uid,
        parentUid: parent.uid,
        childName: childDisplayName,
        loc:
          liveLoc?.lat && liveLoc?.lng
            ? {
                lat: liveLoc.lat,
                lng: liveLoc.lng,
                accuracy: liveLoc.accuracy ?? null,
              }
            : null,
        message: null,
      });
      // Optional: small confirmation toast/alert
      console.log("Emergency alert sent");
    } catch (e: any) {
      console.log("Emergency send failed:", e);
      alert(e?.message ?? "Failed to send emergency alert.");
    } finally {
      setSendingSOS(false);
    }
  }

  /* Load child (AsyncStorage -> auth fallback) */
  const fetchChildData = async (userID: string) => {
    const user = (await getUserById(userID)) as UserDoc;
    setChild(user);
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const cached = await AsyncStorage.getItem("user");
        if (cached) {
          const parsedUser = JSON.parse(cached);
          const userID = parsedUser?.uid as string | undefined;
          if (userID) {
            await fetchChildData(userID);
            return;
          }
        }
        const uid = auth.currentUser?.uid;
        if (uid) await fetchChildData(uid);
      } catch (e) {
        console.log("Load child failed:", e);
      }
    };
    fetchData();
  }, []);

  /* Load parent when child present */
  useEffect(() => {
    (async () => {
      if (child?.parentUid) {
        const p = (await getUserById(child.parentUid)) as UserDoc;
        setParent(p);
      } else {
        setParent(null);
      }
    })();
  }, [child?.parentUid]);

  /* Resolve + subscribe to child's bus */
  useEffect(() => {
    if (busUnsubRef.current) {
      busUnsubRef.current();
      busUnsubRef.current = undefined;
    }
    setBus(null);

    (async () => {
      if (!child?.uid) return;
      try {
        let anyId: string | null = (child as any)?.currentBusId ?? null;
        if (!anyId) anyId = await getApprovedBusForChild(child.uid);
        if (!anyId) {
          setBus(null);
          return;
        }
        const docId = await resolveBusDocId(anyId);
        if (!docId) {
          setBus(null);
          return;
        }
        const unsub = subscribeBusProfileById(
          docId,
          (b) => setBus(b),
          () => setBus(null)
        );
        busUnsubRef.current = unsub;
      } catch (e) {
        console.log("Bus subscribe error:", e);
        setBus(null);
      }
    })();

    return () => {
      if (busUnsubRef.current) {
        busUnsubRef.current();
        busUnsubRef.current = undefined;
      }
    };
  }, [child?.uid]);

  /* Subscribe to today's participant status */
  useEffect(() => {
    if (statusUnsubRef.current) {
      statusUnsubRef.current();
      statusUnsubRef.current = undefined;
    }
    setTourStatus(null);
    if (!child?.uid || !bus?.id) return;

    const dayId = `${bus.id}_${dateKey}`;
    const pRef = doc(
      collection(doc(db, "tours", dayId), "participants"),
      child.uid
    );
    const unsub = onSnapshot(
      pRef,
      (snap) => {
        if (!snap.exists()) {
          setTourStatus(null);
          return;
        }
        const data = snap.data() as any;
        const st: TourStatus | null = data?.[currentSession]?.status ?? null;
        setTourStatus(st);
      },
      () => setTourStatus(null)
    );
    statusUnsubRef.current = unsub;

    return () => {
      if (statusUnsubRef.current) {
        statusUnsubRef.current();
        statusUnsubRef.current = undefined;
      }
    };
  }, [child?.uid, bus?.id, dateKey, currentSession]);

  /* Subscribe to live/last location for this child */
  useEffect(() => {
    if (liveUnsubRef.current) {
      liveUnsubRef.current();
      liveUnsubRef.current = undefined;
    }
    setLiveLoc(null);
    if (!child?.uid) return;
    const unsub = subscribeChildLiveLocation(child.uid, (loc) =>
      setLiveLoc(loc)
    );
    liveUnsubRef.current = unsub;
    return () => {
      if (liveUnsubRef.current) {
        liveUnsubRef.current();
        liveUnsubRef.current = undefined;
      }
    };
  }, [child?.uid]);

  /* Derived UI */
  const parentDisplayName =
    parent?.fullName?.trim() ||
    [parent?.firstName, parent?.lastName].filter(Boolean).join(" ").trim() ||
    parent?.email ||
    "—";

  const childDisplayName =
    child?.fullName?.trim() ||
    [child?.firstName, child?.lastName].filter(Boolean).join(" ").trim() ||
    "Unknown Child";

  const busName =
    bus?.busNickName || bus?.busNumber || bus?.busId || "Not linked";
  const driverName =
    (bus?.firstName || bus?.lastName
      ? `${bus?.firstName ?? ""} ${bus?.lastName ?? ""}`.trim()
      : undefined) || "—";

  const liveLabel = labelForTourStatus(tourStatus);
  const fallback =
    child?.status === "Dropped"
      ? "Dropped"
      : child?.status === "AB"
        ? "AB"
        : child?.status === "Not Going"
          ? "Not Going"
          : child?.status === "Pick In"
            ? "Pick In"
            : child?.status === "On Bus"
              ? "On Bus"
              : "Unknown";
  const statusLabel = liveLabel ?? fallback;
  const chip = statusChipStyle(statusLabel);

  async function onStart() {
    try {
      await startSharingLocation();
      setSharing(true);
    } catch (e: any) {
      alert(e?.message ?? "Location permission denied");
    }
  }
  async function onStop() {
    await stopSharingLocation();
    setSharing(false);
  }

  const updatedAtDate = liveLoc?.updatedAtMs
    ? new Date(liveLoc.updatedAtMs)
    : null;

  const region: Region =
    liveLoc?.lat && liveLoc?.lng
      ? {
          latitude: liveLoc.lat,
          longitude: liveLoc.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01 * (9 / 16),
        }
      : DEFAULT_REGION;

  const openSystemMaps = () => {
    if (!liveLoc?.lat || !liveLoc?.lng) return;
    const name = encodeURIComponent(childDisplayName || "Child");
    const { lat, lng } = liveLoc;
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${name}@${lat},${lng}`
        : `geo:${lat},${lng}?q=${lat},${lng}(${name})`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={false} />

        <Text className="text-xl font-light mt-4">
          Parent Name : {parentDisplayName}
        </Text>

        {/* Share controls */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={onStart}
            className="px-4 py-3 rounded-xl bg-blue-600"
          >
            <Text className="text-white">
              {sharing ? "Sharing…" : "Start Sharing"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onStop}
            className="px-4 py-3 rounded-xl bg-neutral-300"
          >
            <Text>Stop</Text>
          </TouchableOpacity>
        </View>

        {/* Where am I / Last location card */}
        <View
          className="w-full bg-white mt-4 rounded-xl"
          style={{
            overflow: Platform.OS === "ios" ? "hidden" : "visible",
            elevation: 3,
            shadowOpacity: 0.08,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
          }}
        >
          <View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Child Location</Text>
            <View className="flex-row items-center">
              <Text className="text-xs text-gray-600 mr-3">
                Last update: {timeAgo(updatedAtDate)}
              </Text>
              <TouchableOpacity
                disabled={!liveLoc?.lat || !liveLoc?.lng}
                onPress={openSystemMaps}
                className={`px-3 py-1.5 rounded-lg ${
                  liveLoc?.lat ? "bg-blue-600" : "bg-neutral-300"
                }`}
              >
                <Text className="text-white text-xs">Open in Maps</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 200 }}>
            <MapView
              style={StyleSheet.absoluteFillObject}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={region}
              region={region}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {liveLoc?.lat && liveLoc?.lng ? (
                <Marker
                  coordinate={{ latitude: liveLoc.lat, longitude: liveLoc.lng }}
                  title={childDisplayName}
                  description={
                    updatedAtDate
                      ? `Last updated ${timeAgo(updatedAtDate)}`
                      : ""
                  }
                >
                  <View className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-600">
                    <Image
                      source={images.childImage1}
                      className="w-full h-full"
                    />
                  </View>
                </Marker>
              ) : null}
            </MapView>
          </View>

          {/* Small footer with details */}
          <View className="px-4 py-3 border-t border-gray-200">
            {liveLoc?.lat && liveLoc?.lng ? (
              <Text className="text-gray-700 text-sm">
                {`Lat: ${liveLoc.lat.toFixed(5)}  Lng: ${liveLoc.lng.toFixed(5)}`}
                {liveLoc.accuracy
                  ? `  • ±${Math.round(liveLoc.accuracy)}m`
                  : ""}
              </Text>
            ) : (
              <Text className="text-gray-700 text-sm">
                No live location yet. Showing default area.
              </Text>
            )}
          </View>
        </View>

        {/* Child + Bus card */}
        <View className="w-full bg-white mt-4 rounded-xl shadow-md">
          <View className="flex-row items-start p-4">
            <Image
              source={images.childImage1}
              className="h-12 w-12 rounded-full"
            />
            <View className="flex-row ml-4 flex-1 justify-between items-start">
              <View className="flex-1">
                <Text className="text-xl font-semibold text-darkbg capitalize">
                  {childDisplayName}
                </Text>
                <Text className="text-grayText text-base" numberOfLines={1}>
                  {busName}
                </Text>
                <Text className="text-grayText text-base" numberOfLines={1}>
                  Bus No: {bus?.busNumber ?? "—"}
                </Text>
                <Text className="text-grayText text-base" numberOfLines={1}>
                  Driver Name: {driverName}
                </Text>
              </View>
              <Text
                className="px-4 py-2 rounded-full"
                style={{
                  backgroundColor: chip.bg,
                  color: chip.fg,
                  fontWeight: "600" as const,
                }}
              >
                {statusLabel}
              </Text>
            </View>
          </View>

          <View className="border-t border-gray-200 p-4">
            <Text className="text-lg font-semibold mb-2">
              Recent Notifications
            </Text>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-grayText text-base">
                {statusLabel === "Dropped"
                  ? "Dropped at School"
                  : "Status Updated"}
              </Text>
              <Text className="text-grayText text-sm">Just now</Text>
            </View>
          </View>
        </View>

        {/* Emergency big button */}
        <View className="mt-6 w-full items-center">
          {/* Emergency big button */}
          <View className="mt-6 w-full items-center">
            <TouchableOpacity
              className={`w-full h-[300px] rounded-xl ${sendingSOS ? "bg-neutral-400" : "bg-redsh"} gap-2 text-darkbg flex-1 justify-center items-center`}
              onLongPress={onEmergencyHold}
              delayLongPress={800} // require press-and-hold (~0.8s)
              disabled={sendingSOS}
              activeOpacity={0.7}
            >
              <Text className="text-5xl font-light h-12">
                {sendingSOS ? "Sending…" : "Emergency"}
              </Text>
              <Text className="text-lg font-light">Press and Hold</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <TouchableOpacity
            className="w-[48%] bg-yellowsh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => setNotifyDriverModalVisible(true)}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-greensh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => setNotifyParentModalVisible(true)}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Parent
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* notify driver modal */}
      <Modal
        animationType="slide"
        transparent
        visible={notifyDriverModalVisible}
        onRequestClose={() => setNotifyDriverModalVisible(false)}
      >
        <View className="flex-1 justify-end items-center bg-black/80">
          <View className="bg-white rounded-t-lg w-full p-6 pb-12">
            <Text className="text-2xl font-semibold mb-4">Notify Driver</Text>
            <View className="w-full border-b border-gray-200 pb-4 mb-4">
              <TouchableOpacity className="flex-row items-center h-[80px] justify-center bg-blue-500 rounded-lg px-4 py-3">
                <Text className="text-white text-xl font-medium m-auto text-center">
                  Contact Driver
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-darkbg text-lg font-medium">
              Sent Message
            </Text>
            <Text className="text-gray-600 text-lg mb-4 mt-4">
              Enter your message to notify the driver:
            </Text>
            <View className="mb-6">
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base min-h-[80px]"
                placeholder="Type your message..."
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>
            <View className="flex-row justify-between gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10 py-4"
                onPress={() => {
                  setMessage("");
                  setNotifyDriverModalVisible(false);
                }}
              >
                <Text className="text-gray-800 font-medium text-xl text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`rounded-lg px-10 min-w-[48%] py-4 ${
                  message.trim() ? "bg-greensh" : "bg-gray-300"
                }`}
                onPress={() => {
                  console.log("Notify Driver:", message);
                  setMessage("");
                  setNotifyDriverModalVisible(false);
                }}
                disabled={!message.trim()}
              >
                <Text className="text-white font-medium text-xl m-auto text-center">
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* notify parent modal */}
      <Modal
        animationType="slide"
        transparent
        visible={notifyParentModalVisible}
        onRequestClose={() => setNotifyParentModalVisible(false)}
      >
        <View className="flex-1 justify-end items-center bg-black/80">
          <View className="bg-white rounded-t-lg w-full p-6 pb-12">
            <Text className="text-2xl font-semibold mb-4">Notify Parent</Text>
            <View className="w-full border-b border-gray-200 pb-4 mb-4">
              <TouchableOpacity className="flex-row items-center h-[80px] justify-center bg-blue-500 rounded-lg px-4 py-3">
                <Text className="text-white text-xl font-medium m-auto text-center">
                  Contact Parent
                </Text>
              </TouchableOpacity>
            </View>
            <Text className="text-darkbg text-lg font-medium">
              Sent Message
            </Text>
            <Text className="text-gray-600 text-lg mb-4 mt-4">
              Enter your message to notify the Parent:
            </Text>
            <View className="mb-6">
              <TextInput
                className="border border-gray-300 rounded-lg px-3 py-2 text-base min-h-[80px]"
                placeholder="Type your message..."
                multiline
                numberOfLines={3}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
              />
            </View>
            <View className="flex-row justify-between gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10 py-4"
                onPress={() => {
                  setMessage("");
                  setNotifyParentModalVisible(false);
                }}
              >
                <Text className="text-gray-800 font-medium text-xl text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`rounded-lg px-10 min-w-[48%] py-4 ${
                  message.trim() ? "bg-greensh" : "bg-gray-300"
                }`}
                onPress={() => {
                  console.log("Notify Parent:", message);
                  setMessage("");
                  setNotifyParentModalVisible(false);
                }}
                disabled={!message.trim()}
              >
                <Text className="text-white font-medium text-xl m-auto text-center">
                  Send
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChildHome;
