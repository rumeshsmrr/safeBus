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

import type { UserDoc as BaseUserDoc } from "@/types/user";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, doc, onSnapshot } from "firebase/firestore";
import React, { useEffect } from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ------------------ Local augmented type ------------------ */
type UserDoc = BaseUserDoc & {
  status?: "Dropped" | "AB" | "Not Going" | "Pick In" | "On Bus" | "Unknown";
};

/* ------------------ UI helpers ------------------ */
const scrollViewBottomPadding = 24;

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

/* ------------------ Component ------------------ */
const ChildHome = () => {
  // UI state
  const [notifyDriverModalVisible, setNotifyDriverModalVisible] =
    React.useState(false);
  const [notifyParentModalVisible, setNotifyParentModalVisible] =
    React.useState(false);
  const [message, setMessage] = React.useState("");

  const handeleNotifyDriver = () => setNotifyDriverModalVisible(true);
  const handleCloseModal = () => setNotifyDriverModalVisible(false);
  const handleNotifyParent = () => setNotifyParentModalVisible(true);
  const handleCloseParentModal = () => setNotifyParentModalVisible(false);

  // Data state
  const [child, setChild] = React.useState<UserDoc | null>(null);
  const [parent, setParent] = React.useState<UserDoc | null>(null);

  // Connected bus (live) for this child
  const [bus, setBus] = React.useState<(BusProfile & { id: string }) | null>(
    null
  );
  const busUnsubRef = React.useRef<undefined | (() => void)>(undefined);

  // Live tour status (today + current session) for this child
  const [tourStatus, setTourStatus] = React.useState<TourStatus | null>(null);
  const statusUnsubRef = React.useRef<undefined | (() => void)>(undefined);

  // Today/session
  const [dateKey] = React.useState<string>(() => dateKeyFor());
  const currentSession: TourSession = React.useMemo(
    () => (new Date().getHours() < 12 ? "morning" : "evening"),
    []
  );

  /* ------------------ Load child (AsyncStorage -> auth fallback) ------------------ */
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

  /* ------------------ Load parent when child present ------------------ */
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

  /* ------------------ Resolve + subscribe to child's bus ------------------ */
  useEffect(() => {
    if (busUnsubRef.current) {
      busUnsubRef.current();
      busUnsubRef.current = undefined;
    }
    setBus(null);

    (async () => {
      if (!child?.uid) return;

      try {
        // prefer direct link on child
        let anyId: string | null = (child as any)?.currentBusId ?? null;
        // fallback to approved link
        if (!anyId) {
          anyId = await getApprovedBusForChild(child.uid);
        }
        if (!anyId) {
          setBus(null);
          return;
        }
        // resolve to bus doc id
        const docId = await resolveBusDocId(anyId);
        if (!docId) {
          setBus(null);
          return;
        }
        // live subscribe to bus profile
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

  /* ------------------ Subscribe to today's participant status ------------------ */
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

  /* ------------------ Derived display fields ------------------ */
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

  // Prefer live status; fallback to any persisted child.status; otherwise Unknown
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

        {/* Parent name from DB */}
        <Text className="text-xl font-light mt-4">
          Parent Name : {parentDisplayName}
        </Text>

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

                {/* Connected bus name / number */}
                <Text className="text-grayText text-base" numberOfLines={1}>
                  {busName}
                </Text>
                <Text className="text-grayText text-base" numberOfLines={1}>
                  Bus No: {bus?.busNumber ?? "—"}
                </Text>

                {/* Driver name from bus profile */}
                <Text className="text-grayText text-base" numberOfLines={1}>
                  Driver Name: {driverName}
                </Text>
              </View>

              {/* Current status chip */}
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

          {/* Simple recent notifications (static sample placeholder) */}
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
          <TouchableOpacity
            className="w-full h-[300px] rounded-xl bg-redsh gap-2 text-darkbg flex-1 justify-center items-center"
            onLongPress={() => console.log("Emergency Button Pressed")}
            activeOpacity={0.7}
          >
            <Text className="text-5xl font-light h-12">Emergency</Text>
            <Text className="text-lg font-light">Press and Hold</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <TouchableOpacity
            className="w-[48%] bg-yellowsh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={handeleNotifyDriver}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-greensh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={handleNotifyParent}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Parent
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* notify driver modal  */}
      <Modal
        animationType="slide"
        transparent
        visible={notifyDriverModalVisible}
        onRequestClose={handleCloseModal}
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

            <View className="flex-row justify-between space-x-3 gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10 py-4"
                onPress={() => {
                  setMessage("");
                  handleCloseModal();
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
                  console.log("Notify Driver Confirmed:", message);
                  setMessage("");
                  handleCloseModal();
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
        onRequestClose={handleCloseParentModal}
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

            <View className="flex-row justify-between space-x-3 gap-2">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg min-w-[48%] px-10 py-4"
                onPress={() => {
                  setMessage("");
                  handleCloseParentModal();
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
                  console.log("Notify Parent Confirmed:", message);
                  setMessage("");
                  handleCloseParentModal();
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
