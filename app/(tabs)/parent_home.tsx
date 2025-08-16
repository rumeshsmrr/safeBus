// app/ParentHome.tsx
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
  type Region,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import { getApprovedBusForChild } from "@/data/busChildren";
import {
  resolveBusDocId,
  subscribeBusProfileById,
  type BusProfile,
} from "@/data/busProfiles";
import { subscribeMyChildren } from "@/data/users";
import type { UserDoc as BaseUserDoc } from "@/types/user";
import Header from "../Components/header";

/* ------------------ Types ------------------ */
type UserDoc = BaseUserDoc & {
  status?: string; // optional UI-only status
};

type BusForChild = (BusProfile & { id: string }) | null;

/* ------------------ Map sizing ------------------ */
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * (9 / 16);

/* ------------------ Hardcoded child coords (optional overrides) ------------------ */
const HARDCODED_LOC: Record<string, LatLng> = {
  // "childUid123": { latitude: 6.8856, longitude: 79.8596 },
};

/* ------------------ Helpers ------------------ */
const childDisplayName = (u: UserDoc) =>
  u.fullName ||
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  "Unnamed";

function getChildCoord(u: UserDoc): LatLng | undefined {
  if (u.uid && HARDCODED_LOC[u.uid]) return HARDCODED_LOC[u.uid];
  const home = (u as any)?.homeLocation;
  if (
    home &&
    typeof home.latitude === "number" &&
    typeof home.longitude === "number"
  ) {
    return { latitude: home.latitude, longitude: home.longitude };
  }
  const school = (u as any)?.schoolLocation;
  if (
    school &&
    typeof school.latitude === "number" &&
    typeof school.longitude === "number"
  ) {
    return { latitude: school.latitude, longitude: school.longitude };
  }
  return undefined;
}

const statusChipStyle = (status: string) => {
  switch (status) {
    case "On Bus":
      return { bg: "#FFF2C6", fg: "#7A5C00" };
    case "Dropped":
      return { bg: "#DAFADD", fg: "#0B5D1E" };
    case "AB":
      return { bg: "#FCD9D9", fg: "#7C1D1D" };
    default:
      return { bg: "#EAEAEA", fg: "#444" };
  }
};

/* ------------------ Screen ------------------ */
const ParentHome = () => {
  const router = useRouter();

  const [children, setChildren] = useState<UserDoc[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // childUid -> live bus profile (or null if not linked)
  const [busByChild, setBusByChild] = useState<Record<string, BusForChild>>({});
  const liveSubs = useRef<Record<string, (() => void) | undefined>>({}); // per child subscription cleanup

  // contact modal
  const [contactVisible, setContactVisible] = useState(false);
  const [contactPhone, setContactPhone] = useState<string | null>(null);

  // Full-screen map
  const [mapVisible, setMapVisible] = useState(false);
  const miniMapRef = useRef<MapView | null>(null);
  const fullMapRef = useRef<MapView | null>(null);

  // Subscribe to this parent's children in realtime
  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => {
      setChildren(kids);
      setLoading(false);
    });
    if (!unsub) setLoading(false);
    return () => unsub?.();
  }, []);

  // For each child, resolve the connected bus then live-subscribe
  useEffect(() => {
    // clear existing subs
    Object.values(liveSubs.current).forEach((u) => u?.());
    liveSubs.current = {};
    setBusByChild({});

    if (!children || children.length === 0) return;

    children.forEach((child) => {
      (async () => {
        try {
          let anyId = child.currentBusId ?? null;
          if (!anyId) anyId = await getApprovedBusForChild(child.uid);

          if (!anyId) {
            setBusByChild((prev) => ({ ...prev, [child.uid]: null }));
            return;
          }

          const docId = await resolveBusDocId(anyId);
          if (!docId) {
            setBusByChild((prev) => ({ ...prev, [child.uid]: null }));
            return;
          }

          const unsub = subscribeBusProfileById(
            docId,
            (bus) => setBusByChild((prev) => ({ ...prev, [child.uid]: bus })),
            () => setBusByChild((prev) => ({ ...prev, [child.uid]: null }))
          );
          liveSubs.current[child.uid] = unsub;
        } catch {
          setBusByChild((prev) => ({ ...prev, [child.uid]: null }));
        }
      })();
    });

    return () => {
      Object.values(liveSubs.current).forEach((u) => u?.());
      liveSubs.current = {};
    };
  }, [children]);

  // Build coords from children (with overrides)
  const coords: { uid: string; name: string; coord: LatLng }[] = useMemo(() => {
    if (!children) return [];
    return children
      .map((c) => {
        const coord = getChildCoord(c);
        if (!coord) return null;
        return { uid: c.uid, name: childDisplayName(c), coord };
      })
      .filter(Boolean) as { uid: string; name: string; coord: LatLng }[];
  }, [children]);

  const initialRegion: Region = useMemo(() => {
    const first = coords[0]?.coord;
    return {
      latitude: first?.latitude ?? 6.9271,
      longitude: first?.longitude ?? 79.8612,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
  }, [coords]);

  useEffect(() => {
    if (!miniMapRef.current || coords.length === 0) return;
    const c = coords.map((x) => x.coord);
    if (c.length === 1) {
      miniMapRef.current.animateToRegion(
        {
          ...initialRegion,
          latitude: c[0].latitude,
          longitude: c[0].longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        400
      );
    } else {
      miniMapRef.current.fitToCoordinates(c, {
        edgePadding: { top: 24, right: 24, bottom: 24, left: 24 },
        animated: true,
      });
    }
  }, [coords, initialRegion]);

  /* ------------------ Actions ------------------ */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // subs are live; we just simulate a refresh touchpoint
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const openSystemMaps = (point: LatLng, label?: string) => {
    const name = encodeURIComponent(label || "Location");
    const { latitude, longitude } = point;
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${name}@${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${name})`;
    Linking.openURL(url).catch(() => {});
  };

  const openBusForChild = async (child: UserDoc) => {
    try {
      Haptics.selectionAsync();
      const cached = busByChild[child.uid];
      const cachedDocId = cached?.id;
      if (cachedDocId) {
        router.push(`/busDetails?docId=${encodeURIComponent(cachedDocId)}`);
        return;
      }
      let anyId =
        child.currentBusId ?? (await getApprovedBusForChild(child.uid));
      if (!anyId) {
        Alert.alert("Not linked", "This child isn’t linked to a bus yet.");
        return;
      }
      const docId = await resolveBusDocId(anyId);
      if (!docId) {
        Alert.alert("Bus not found", "We couldn’t find details for this bus.");
        return;
      }
      router.push(`/busDetails?docId=${encodeURIComponent(docId)}`);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Unable to open bus details.");
    }
  };

  const openContactSheet = (phone?: string | null) => {
    if (!phone) {
      Alert.alert("No number", "Bus owner/driver hasn’t added a phone number.");
      return;
    }
    setContactPhone(phone);
    setContactVisible(true);
  };

  const callPhone = () => {
    if (contactPhone) Linking.openURL(`tel:${contactPhone}`);
    setContactVisible(false);
  };

  const smsPhone = () => {
    if (contactPhone) Linking.openURL(`sms:${contactPhone}`);
    setContactVisible(false);
  };

  // Footer offsets (adjust if you have a fixed footer/tab bar)
  const FIXED_FOOTER_HEIGHT = 120;
  const TAB_BAR_HEIGHT = 70;
  const TAB_BAR_BOTTOM_MARGIN = 36;
  const EXTRA_PADDING_FOR_SCROLL = 20;
  const scrollViewBottomPadding =
    FIXED_FOOTER_HEIGHT +
    TAB_BAR_HEIGHT +
    TAB_BAR_BOTTOM_MARGIN +
    EXTRA_PADDING_FOR_SCROLL;

  const ActionButton = ({
    title,
    icon,
    bg,
    navigateTo,
  }: {
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    bg: string;
    navigateTo: string;
  }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.selectionAsync();
        router.push(navigateTo as any);
      }}
      className="w-[48%] rounded-2xl px-4 py-4 mb-4 flex-row items-center"
      style={{ backgroundColor: bg }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: "rgba(255,255,255,0.35)" }}
      >
        <Ionicons name={icon} size={22} color="#1E293B" />
      </View>
      <Text className="text-lg text-gray-800">{title}</Text>
    </TouchableOpacity>
  );

  const ChildCardSkeleton = () => (
    <View
      className="w-full rounded-2xl bg-white"
      style={{
        marginTop: 16,
        overflow: "hidden",
        elevation: 3,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        zIndex: 1,
      }}
    >
      <LinearGradient
        colors={["#eef2ff", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 4 }}
      />
      <BlurView
        intensity={Platform.OS === "android" ? 20 : 30}
        tint="light"
        className="p-4"
      >
        <View className="flex-row items-center">
          <View className="h-12 w-12 rounded-full bg-neutral-200" />
          <View className="ml-4 flex-1">
            <View className="h-5 bg-neutral-200 rounded w-1/2 mb-2" />
            <View className="h-4 bg-neutral-200 rounded w-2/3 mb-2" />
            <View className="h-4 bg-neutral-200 rounded w-1/3" />
          </View>
          <View className="h-7 w-20 bg-neutral-200 rounded-full" />
        </View>
      </BlurView>
    </View>
  );

  const ChildCard = ({ child }: { child: UserDoc }) => {
    const name = childDisplayName(child);
    const linkedBus = busByChild[child.uid];

    const busName =
      linkedBus?.busNickName ||
      linkedBus?.busNumber ||
      linkedBus?.busId ||
      "Not linked";

    const contactName =
      linkedBus?.firstName || linkedBus?.lastName
        ? `${linkedBus?.firstName ?? ""} ${linkedBus?.lastName ?? ""}`.trim()
        : "-";

    const status = child.currentBusId
      ? "On Bus"
      : child.status === "Dropped"
        ? "Dropped"
        : child.status === "AB"
          ? "AB"
          : "Unknown";

    const chip = statusChipStyle(status);

    return (
      <View
        className="w-full rounded-2xl bg-white"
        style={{
          marginTop: 16,
          overflow: "hidden",
          elevation: 3,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          zIndex: 1,
        }}
      >
        <LinearGradient
          colors={["#c7d2fe", "#ffffff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 4 }}
        />
        <BlurView
          intensity={Platform.OS === "android" ? 20 : 35}
          tint="light"
          className="bg-white/60"
        >
          <View className="flex-row items-start p-4">
            <Image
              source={images.childImage1}
              className="h-12 w-12 rounded-full"
            />
            <View className="flex-row ml-4 flex-1 justify-between items-start">
              <View className="flex-1 pr-2">
                <Text
                  className="text-xl font-semibold text-zinc-900 capitalize"
                  numberOfLines={1}
                >
                  {name}
                </Text>
                <Text className="text-zinc-600 text-base" numberOfLines={1}>
                  {busName}
                </Text>
                <Text className="text-zinc-600 text-base" numberOfLines={1}>
                  Driver/Owner: {contactName || "-"}
                </Text>
              </View>
              <View
                className="px-3 py-1.5 rounded-full"
                style={{ backgroundColor: chip.bg }}
              >
                <Text style={{ color: chip.fg, fontWeight: "600" }}>
                  {status}
                </Text>
              </View>
            </View>
          </View>

          <View className="border-t border-zinc-200 px-4 py-3 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => openBusForChild(child)}
              className="flex-row items-center"
            >
              <Ionicons name="bus-outline" size={18} color="#2563EB" />
              <Text className="text-blue-600 ml-1.5">View Bus</Text>
            </TouchableOpacity>

            <TouchableOpacity
              // onPress={() =>
              //   openContactSheet(
              //     linkedBus?.contactNumber || child?.contactNumber || null
              //   )
              // }
              className="flex-row items-center"
            >
              <Ionicons name="call-outline" size={18} color="#2563EB" />
              <Text className="text-blue-600 ml-1.5">Contact</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/DriverProfileScreen" as any)}
              className="flex-row items-center"
            >
              <Ionicons name="person-outline" size={18} color="#2563EB" />
              <Text className="text-blue-600 ml-1.5">View Driver</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      {/* Keep gradient behind everything & non-interactive */}
      <View
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["#EEF2FF", "#FFFFFF"]}
          style={{ height: 220, width: "100%" }}
        />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollViewBottomPadding,
          paddingTop: 12,
        }}
        style={{ zIndex: 1, position: "relative" }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Header isCode />

        {/* Loading / Empty */}
        {loading && (
          <View className="mt-2">
            <ChildCardSkeleton />
            <ChildCardSkeleton />
          </View>
        )}

        {!loading && (!children || children.length === 0) && (
          <View className="mt-10 items-center">
            <Ionicons name="happy-outline" size={40} color="#94A3B8" />
            <Text className="text-neutral-500 mt-2">
              No children linked yet.
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/LinkChildScreen" as any)}
              className="mt-3 px-4 py-2 rounded-xl bg-blue-600"
            >
              <Text className="text-white">Link a Child</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Child cards from DB */}
        {!loading &&
          children &&
          children.map((c) => <ChildCard key={c.uid} child={c} />)}

        {/* Map + Emergency row */}
        {!loading && (
          <View className="w-full mt-5" style={{ zIndex: 1 }}>
            <View className="flex-row">
              {/* Mini map */}
              <View
                className="rounded-2xl overflow-hidden bg-white"
                style={{
                  flex: 1,
                  height: 180,
                  marginRight: 8,
                  elevation: 3,
                  shadowOpacity: 0.08,
                  shadowRadius: 12,
                  shadowOffset: { width: 0, height: 6 },
                }}
              >
                <View className="flex-row items-center justify-between px-4 py-2 bg-white">
                  <Text className="text-lg font-semibold">Child Locations</Text>
                  <View className="flex-row">
                    <TouchableOpacity
                      className="mr-3"
                      onPress={() => setMapVisible(true)}
                    >
                      <Ionicons
                        name="expand-outline"
                        size={20}
                        color="#2563EB"
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        if (!coords.length || !miniMapRef.current) return;
                        const c = coords.map((x) => x.coord);
                        if (c.length === 1) {
                          miniMapRef.current.animateToRegion(
                            {
                              latitude: c[0].latitude,
                              longitude: c[0].longitude,
                              latitudeDelta: 0.03,
                              longitudeDelta: 0.03,
                            },
                            300
                          );
                        } else {
                          miniMapRef.current.fitToCoordinates(c, {
                            edgePadding: {
                              top: 24,
                              right: 24,
                              bottom: 24,
                              left: 24,
                            },
                            animated: true,
                          });
                        }
                      }}
                    >
                      <Ionicons
                        name="locate-outline"
                        size={20}
                        color="#2563EB"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <MapView
                  ref={miniMapRef}
                  className="flex-1"
                  provider={
                    Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
                  }
                  initialRegion={initialRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  {coords.map(({ uid, name, coord }) => (
                    <Marker key={uid} coordinate={coord} title={name}>
                      <View className="w-9 h-9 rounded-full overflow-hidden border-2 border-blue-500">
                        <Image
                          source={images.childImage1}
                          className="w-full h-full"
                        />
                      </View>
                    </Marker>
                  ))}
                </MapView>
              </View>

              {/* Emergency tile — responsive width to avoid overlap */}
              <TouchableOpacity
                className="rounded-2xl overflow-hidden"
                onPress={() => {
                  Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Warning
                  );
                  router.push("/EmergencyScreen" as any);
                }}
                activeOpacity={0.9}
                style={{
                  flex: 0.75, // instead of fixed width; prevents overlap on small screens
                  height: 180,
                  marginLeft: 8,
                  elevation: 3,
                }}
              >
                <LinearGradient
                  colors={["#ff6b6b", "#ff3b3b"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: "absolute", inset: 0 }}
                />
                <View className="flex-1 items-center justify-center">
                  <Ionicons
                    name="alert-circle-outline"
                    size={36}
                    color="#fff"
                  />
                  <Text className="text-xl text-white font-bold mt-2">
                    Emergency
                  </Text>
                  <Text className="text-white/80 text-xs mt-1">
                    Tap for options
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Actions grid */}
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <ActionButton
            title="Notify Driver"
            icon="notifications-outline"
            bg="#F8B959"
            navigateTo="NotifyDriverScreen"
          />
          <ActionButton
            title="Buddy System"
            icon="people-outline"
            bg="#F292F1"
            navigateTo="BuddySystemScreen"
          />
          <ActionButton
            title="Lost & Found"
            icon="briefcase-outline"
            bg="#A9C9FB"
            navigateTo="LostFoundScreen"
          />
          <ActionButton
            title="Chat Bot"
            icon="chatbubble-ellipses-outline"
            bg="#8FE3D3"
            navigateTo="ChatBotScreen"
          />
        </View>
      </ScrollView>

      {/* Floating Emergency FAB (always on top, no overlap) */}
      <TouchableOpacity
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          router.push("/EmergencyScreen" as any);
        }}
        className="absolute right-5 bottom-7 w-14 h-14 rounded-full items-center justify-center"
        style={{
          backgroundColor: "#ef4444",
          zIndex: 50,
          elevation: 8,
          shadowOpacity: 0.2,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
        }}
      >
        <Ionicons name="alert" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Full-screen map overlay (highest z-index) */}
      {mapVisible && (
        <View className="absolute inset-0 bg-white" style={{ zIndex: 100 }}>
          <SafeAreaView className="flex-1">
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-neutral-200">
              <Text className="text-lg font-semibold">Child Locations</Text>
              <View className="flex-row">
                <TouchableOpacity
                  disabled={coords.length === 0}
                  onPress={() =>
                    coords.length &&
                    openSystemMaps(coords[0].coord, coords[0].name)
                  }
                  className={`px-3 py-2 rounded-xl mr-2 ${coords.length ? "bg-blue-600" : "bg-neutral-300"}`}
                >
                  <Text className="text-white">Open in Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMapVisible(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-200"
                >
                  <Text>Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Full map toolbar */}
            <View className="px-4 py-2 flex-row items-center justify-end bg-white border-b border-neutral-200">
              <TouchableOpacity
                className="flex-row items-center mr-3"
                onPress={() => {
                  if (!fullMapRef.current || coords.length === 0) return;
                  const c = coords.map((x) => x.coord);
                  if (c.length === 1) {
                    const s = c[0];
                    fullMapRef.current.animateToRegion(
                      {
                        latitude: s.latitude,
                        longitude: s.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      400
                    );
                  } else {
                    fullMapRef.current.fitToCoordinates(c, {
                      edgePadding: { top: 50, right: 50, bottom: 80, left: 50 },
                      animated: true,
                    });
                  }
                }}
              >
                <Ionicons name="scan-outline" size={18} color="#2563EB" />
                <Text className="text-blue-600 ml-1">Fit All</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => {
                  if (!fullMapRef.current || coords.length === 0) return;
                  const s = coords[0].coord;
                  fullMapRef.current.animateToRegion(
                    {
                      latitude: s.latitude,
                      longitude: s.longitude,
                      latitudeDelta: 0.02,
                      longitudeDelta: 0.02,
                    },
                    400
                  );
                }}
              >
                <Ionicons name="pin-outline" size={18} color="#2563EB" />
                <Text className="text-blue-600 ml-1">Center First</Text>
              </TouchableOpacity>
            </View>

            <MapView
              ref={fullMapRef}
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={initialRegion}
              onMapReady={() => {
                setTimeout(() => {
                  if (!fullMapRef.current || coords.length === 0) return;
                  const c = coords.map((x) => x.coord);
                  if (c.length === 1) {
                    const s = c[0];
                    fullMapRef.current.animateToRegion(
                      {
                        latitude: s.latitude,
                        longitude: s.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      400
                    );
                  } else {
                    fullMapRef.current.fitToCoordinates(c, {
                      edgePadding: { top: 50, right: 50, bottom: 80, left: 50 },
                      animated: true,
                    });
                  }
                }, 150);
              }}
            >
              {coords.map(({ uid, name, coord }) => (
                <Marker key={uid} coordinate={coord} title={name}>
                  <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-600">
                    <Image
                      source={images.childImage1}
                      className="w-full h-full"
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
          </SafeAreaView>
        </View>
      )}

      {/* Contact Driver Sheet */}
      <Modal
        visible={contactVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContactVisible(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/40">
          <View className="w-11/12 rounded-2xl bg-white p-5">
            <Text className="text-lg font-semibold mb-3">Contact Driver</Text>
            <Text className="text-zinc-600 mb-4">{contactPhone || "-"}</Text>
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={callPhone}
                className="flex-row items-center px-4 py-3 rounded-xl bg-blue-600"
              >
                <Ionicons name="call-outline" size={18} color="#fff" />
                <Text className="text-white ml-2">Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={smsPhone}
                className="flex-row items-center px-4 py-3 rounded-xl bg-green-600"
              >
                <Ionicons name="chatbox-outline" size={18} color="#fff" />
                <Text className="text-white ml-2">SMS</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setContactVisible(false)}
                className="flex-row items-center px-4 py-3 rounded-xl bg-neutral-200"
              >
                <Ionicons name="close-outline" size={18} color="#111" />
                <Text className="ml-2">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ParentHome;
