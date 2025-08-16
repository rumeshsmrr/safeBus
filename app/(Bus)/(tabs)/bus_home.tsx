// app/BusHome.tsx
import Header from "@/app/Components/header";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  dateKeyFor,
  ensureTourDay,
  getMyFirstBusId,
  subscribeTourParticipants,
  updateParticipantStatus,
  type TourParticipant,
  type TourSession,
  type TourStatus,
} from "@/data/tours";

/* =================== Status meta =================== */

const STATUS_META: Record<
  TourStatus,
  { label: string; pill: string; text: string }
> = {
  PICK_IN: { label: "Pick In", pill: "bg-green-500", text: "text-white" },
  ON_BUS: { label: "On Bus", pill: "bg-amber-400", text: "text-amber-950" },
  DROPPED: { label: "Dropped", pill: "bg-emerald-600", text: "text-white" },
  ABSENT: { label: "Ab", pill: "bg-red-500", text: "text-white" },
  NOT_GOING: { label: "Not Going", pill: "bg-pink-400", text: "text-white" },
};

/* =================== Small bits =================== */

const StatusSheet = ({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: TourStatus | null;
  onSelect: (s: TourStatus) => void;
  onClose: () => void;
}) => {
  const options: TourStatus[] = [
    "PICK_IN",
    "ON_BUS",
    "DROPPED",
    "ABSENT",
    "NOT_GOING",
  ];
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white px-4 pt-4 pb-6 rounded-t-3xl">
        <Text className="text-lg font-semibold mb-3">Update Status</Text>
        <View className="gap-2">
          {options.map((key) => {
            const m = STATUS_META[key];
            const selected = current === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onSelect(key)}
                className={`flex-row items-center justify-between rounded-2xl px-4 py-3 border ${
                  selected ? "border-blue-500 bg-blue-50" : "border-neutral-200"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-8 h-8 rounded-full ${m.pill}`} />
                  <Text className="text-base">{m.label}</Text>
                </View>
                {selected ? <Text className="text-blue-600">✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="mt-4 bg-neutral-200 rounded-2xl py-3 items-center"
        >
          <Text className="text-neutral-800">Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const StudentRow = ({
  p,
  session,
  onPressStatus,
  onPressMap,
}: {
  p: TourParticipant;
  session: TourSession;
  onPressStatus: (childUid: string) => void;
  onPressMap: (childUid: string) => void;
}) => {
  const s = p[session];
  const m = STATUS_META[s.status];
  const muted = !s.going || s.status === "NOT_GOING";
  return (
    <View
      className={`w-full rounded-2xl px-3 py-3 mb-3 bg-white/70 border border-white ${
        muted ? "opacity-60" : "opacity-100"
      }`}
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 rounded-full bg-blue-200 items-center justify-center mr-3">
          <Text className="text-blue-700 text-lg">
            {p.childName?.charAt(0) ?? "S"}
          </Text>
        </View>

        <View className="flex-1">
          <Text className="text-xl text-neutral-900" numberOfLines={1}>
            {p.childName}
          </Text>
          <Text className="text-lg text-neutral-500" numberOfLines={1}>
            {p.address || p.homeLocation?.address || "—"}
          </Text>

          {p.homeLocation?.latitude && p.homeLocation?.longitude ? (
            <View className="mt-2">
              <TouchableOpacity
                onPress={() => onPressMap(p.childUid)}
                className="self-start px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200"
              >
                <Text className="text-blue-700 text-xs">View on Map</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={() => onPressStatus(p.childUid)}
          className={`flex-row items-center gap-2 px-3 py-2 rounded-full ${m.pill} ${m.text}`}
        >
          <Text className="text-sm">{m.label}</Text>
          <Text className="text-sm">▾</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* =================== Main =================== */

const scrollViewBottomPadding = 28;

const BusHome: React.FC = () => {
  const insets = useSafeAreaInsets();

  const [session, setSession] = useState<TourSession>("morning");
  const [busId, setBusId] = useState<string | null>(null);
  const [dateKey] = useState<string>(() => dateKeyFor());
  const [dayLoading, setDayLoading] = useState(true);
  const [started, setStarted] = useState(false);

  const [participants, setParticipants] = useState<TourParticipant[] | null>(
    null
  );

  // status sheet
  const [sheetUid, setSheetUid] = useState<string | null>(null);

  // map modal
  const [mapUid, setMapUid] = useState<string | null>(null);

  // refresh/sync state
  const [syncing, setSyncing] = useState(false);

  /* prepare the day (safe, non-transactional) */
  useEffect(() => {
    (async () => {
      try {
        const id = await getMyFirstBusId();
        setBusId(id);
        if (!id) return; // not a driver / no bus
        await ensureTourDay(id, dateKey);
      } catch (e) {
        console.error("ensureTourDay failed:", e);
      } finally {
        setDayLoading(false);
      }
    })();
  }, [dateKey]);

  /* subscribe to participants when bus is ready */
  useEffect(() => {
    if (!busId) return;
    const unsub = subscribeTourParticipants(busId, dateKey, setParticipants);
    return () => unsub();
  }, [busId, dateKey]);

  const listForSession = useMemo(() => {
    const all = participants ?? [];
    // show all, but place NOT_GOING at the end
    const filtered = [...all].sort((a, b) => {
      const sa = a[session];
      const sb = b[session];
      const rank = (s: TourStatus) =>
        s === "NOT_GOING" ? 3 : s === "PICK_IN" ? 0 : s === "ON_BUS" ? 1 : 2;
      return rank(sa.status) - rank(sb.status);
    });
    return filtered;
  }, [participants, session]);

  const current = participants?.find((p) => p.childUid === sheetUid) ?? null;
  const currentStatus: TourStatus | null = current
    ? current[session].status
    : null;

  const handleSelectStatus = async (s: TourStatus) => {
    if (!busId || !sheetUid) return;
    try {
      await updateParticipantStatus({
        busId,
        childUid: sheetUid,
        session,
        status: s,
        dateKey,
      });
    } finally {
      setSheetUid(null);
    }
  };

  /* manual refresh (re-sync approved children → participants) */
  const refreshTour = async () => {
    if (!busId) return;
    try {
      setSyncing(true);
      await ensureTourDay(busId, dateKey); // also re-syncs participants
    } finally {
      setSyncing(false);
    }
  };

  /* map region for a chosen child */
  const mapCoord = useMemo(() => {
    const p = participants?.find((x) => x.childUid === mapUid);
    if (!p?.homeLocation) return undefined;
    const { latitude, longitude } = p.homeLocation;
    if (typeof latitude !== "number" || typeof longitude !== "number")
      return undefined;
    const region: Region = {
      latitude,
      longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    return { region, title: p.childName, address: p.homeLocation.address };
  }, [mapUid, participants]);

  /* ---------- UI ---------- */

  return (
    <SafeAreaView
      className="flex-1 bg-light-100"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding + insets.bottom,
        }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={syncing} onRefresh={refreshTour} />
        }
      >
        <Header isCode={false} />

        {/* Session toggle + Refresh */}
        <View className="mt-3 mb-4 w-full flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Text
              className={`text-xl ${
                session === "morning" ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              Morning Route
            </Text>
            <Switch
              value={session === "evening"}
              onValueChange={(val) => setSession(val ? "evening" : "morning")}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={"#2563eb"}
            />
            <Text
              className={`text-xl ${
                session === "evening" ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              Evening Route
            </Text>
          </View>

          <TouchableOpacity
            onPress={refreshTour}
            disabled={syncing || dayLoading || !busId}
            className={`w-10 h-10 rounded-full items-center justify-center ${
              syncing || dayLoading || !busId ? "bg-neutral-200" : "bg-white"
            } border border-neutral-200`}
          >
            {syncing ? (
              <ActivityIndicator />
            ) : (
              <Ionicons name="refresh" size={18} color="#2563eb" />
            )}
          </TouchableOpacity>
        </View>

        {/* Preparing / No bus */}
        {dayLoading && (
          <View className="bg-white rounded-2xl p-6 items-center">
            <ActivityIndicator />
            <Text className="text-neutral-500 mt-2">
              Preparing today’s tour…
            </Text>
          </View>
        )}

        {!dayLoading && !busId && (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Text className="text-neutral-800 font-semibold">
              No bus found for your account
            </Text>
            <Text className="text-neutral-500 text-sm mt-1 text-center">
              Ask your admin to set you as the owner of a bus profile.
            </Text>
          </View>
        )}

        {/* Start Tour card */}
        {!dayLoading && busId && !started && (
          <View className="bg-white rounded-2xl p-6 items-center">
            <Text className="text-lg font-semibold">Today’s tour is ready</Text>
            <Text className="text-neutral-500 text-sm mt-1 mb-4 text-center">
              Press start to load the student list for the {session} session. If
              you just approved a new child, tap refresh first.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={refreshTour}
                disabled={syncing}
                className={`px-4 py-3 rounded-2xl ${
                  syncing ? "bg-neutral-300" : "bg-white"
                } border border-neutral-300`}
              >
                {syncing ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-neutral-800 font-semibold">
                    Refresh
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStarted(true)}
                className="px-6 py-3 rounded-2xl bg-blue-600"
              >
                <Text className="text-white font-semibold">
                  Start {session === "morning" ? "Morning" : "Evening"} Tour
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Students list */}
        {!dayLoading && busId && started && (
          <View className="mt-2">
            {participants === null ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <ActivityIndicator />
                <Text className="text-neutral-500 mt-2">Loading students…</Text>
              </View>
            ) : listForSession.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Text className="text-neutral-800 font-semibold">
                  No students for this session
                </Text>
                <Text className="text-neutral-500 text-sm mt-1 text-center">
                  If this looks wrong, refresh the tour or check approved
                  children for the bus.
                </Text>
                <TouchableOpacity
                  onPress={refreshTour}
                  disabled={syncing}
                  className={`mt-3 px-4 py-3 rounded-2xl ${
                    syncing ? "bg-neutral-300" : "bg-blue-600"
                  }`}
                >
                  {syncing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">Refresh</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              listForSession.map((p) => (
                <StudentRow
                  key={p.id}
                  p={p}
                  session={session}
                  onPressStatus={(uid) => setSheetUid(uid)}
                  onPressMap={(uid) => setMapUid(uid)}
                />
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Status chooser */}
      <StatusSheet
        visible={!!sheetUid}
        onClose={() => setSheetUid(null)}
        current={currentStatus}
        onSelect={handleSelectStatus}
      />

      {/* Full-screen map */}
      <Modal
        visible={!!mapUid}
        animationType="slide"
        onRequestClose={() => setMapUid(null)}
      >
        <SafeAreaView className="flex-1 bg-light-100">
          <View className="px-4 py-3 flex-row items-center justify-between border-b border-neutral-200">
            <Text className="text-lg font-semibold" numberOfLines={1}>
              {mapCoord?.title || "Child Location"}
            </Text>
            <TouchableOpacity
              onPress={() => setMapUid(null)}
              className="px-3 py-2 rounded-xl bg-neutral-200"
            >
              <Text>Close</Text>
            </TouchableOpacity>
          </View>
          {mapCoord ? (
            <>
              <MapView style={{ flex: 1 }} initialRegion={mapCoord.region}>
                <Marker
                  coordinate={mapCoord.region}
                  title={mapCoord.title ?? undefined}
                  description={mapCoord.address ?? undefined}
                />
              </MapView>
              <View className="px-4 py-3 border-t border-neutral-200 bg-white">
                <Text className="text-neutral-700" numberOfLines={2}>
                  {mapCoord.address || "—"}
                </Text>
              </View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-neutral-500">No location available</Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default BusHome;
