// app/BusJoinRequests.tsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Header from "@/app/Components/header";
import { auth, db } from "@/app/lib/firebase";
import {
  approveBusChildRequest,
  rejectBusChildRequest,
  subscribePendingBusChildRequests,
  type BusChild,
} from "@/data/busChildren";
import { getUserById } from "@/data/users";
import { UserDoc } from "@/types/user";
import { collection, getDocs, limit, query, where } from "firebase/firestore";

/* --------------------- tiny UI bits --------------------- */
const Pill = ({
  label,
  tone = "blue",
}: {
  label: string;
  tone?: "blue" | "red" | "gray";
}) => {
  const base = "px-2.5 py-1 rounded-full text-xs";
  const toneCls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700"
      : tone === "red"
        ? "bg-rose-50 text-rose-700"
        : "bg-neutral-100 text-neutral-700";
  return <Text className={`${base} ${toneCls}`}>{label}</Text>;
};

const Row = ({ children }: { children: React.ReactNode }) => (
  <View className="flex-row items-center justify-between">{children}</View>
);

/* --------------------- main screen --------------------- */

const BusJoinRequests = () => {
  const params = useLocalSearchParams<{ busId?: string }>();
  const [busId, setBusId] = useState<string | null>(params.busId ?? null);
  const [loadingBus, setLoadingBus] = useState<boolean>(!params.busId);
  const [noBusFound, setNoBusFound] = useState(false);

  const [pending, setPending] = useState<BusChild[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // user cache (child & parent profiles)
  const [userCache, setUserCache] = useState<Record<string, UserDoc | null>>(
    {}
  );

  // reject modal
  const [rejectFor, setRejectFor] = useState<BusChild | null>(null);
  const [reason, setReason] = useState("");

  // in-flight action state (disable buttons to avoid double taps)
  const [actingOn, setActingOn] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* Resolve busId if not provided: first bus owned by current user */
  useEffect(() => {
    if (busId) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoadingBus(false);
      setNoBusFound(true);
      return;
    }
    (async () => {
      try {
        const snaps = await getDocs(
          query(
            collection(db, "busProfiles"),
            where("ownerUid", "==", uid),
            limit(1)
          )
        );
        if (!snaps.empty) {
          if (mountedRef.current) setBusId(snaps.docs[0].id);
        } else {
          if (mountedRef.current) setNoBusFound(true);
        }
      } finally {
        if (mountedRef.current) setLoadingBus(false);
      }
    })();
  }, [busId]);

  /* Subscribe to pending requests for this bus */
  useEffect(() => {
    if (!busId) return;
    const unsub = subscribePendingBusChildRequests(busId, (list) => {
      setPending(list);
    });
    return () => unsub?.();
  }, [busId]);

  /* Fetch user docs (child + parent) into cache, guarded by mount */
  useEffect(() => {
    if (!pending || pending.length === 0) return;
    const ids = new Set<string>();
    pending.forEach((r) => {
      if (!(r.childUid in userCache)) ids.add(r.childUid);
      if (!(r.parentUid in userCache)) ids.add(r.parentUid);
    });
    if (ids.size === 0) return;

    (async () => {
      const entries = await Promise.all(
        Array.from(ids).map(
          async (uid) => [uid, await getUserById(uid)] as const
        )
      );
      if (!mountedRef.current) return;
      setUserCache((prev) => {
        const next = { ...prev };
        entries.forEach(([uid, doc]) => (next[uid] = doc));
        return next;
      });
    })();
  }, [pending, userCache]);

  /* Actions */
  const approve = async (r: BusChild) => {
    if (!busId) return;
    try {
      setActingOn(r.id);
      await approveBusChildRequest({ busId, childUid: r.childUid });
      if (mountedRef.current) {
        setActingOn(null);
        Alert.alert("Approved", "Child successfully linked to the bus.");
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setActingOn(null);
        Alert.alert("Unable to approve", e?.message ?? "Try again.");
      }
    }
  };

  const openReject = (r: BusChild) => {
    setRejectFor(r);
    setReason("");
  };

  const confirmReject = async () => {
    if (!busId || !rejectFor) return;
    try {
      setActingOn(rejectFor.id);
      await rejectBusChildRequest({
        busId,
        childUid: rejectFor.childUid,
        reason: reason.trim() || undefined,
      });
      if (mountedRef.current) {
        setActingOn(null);
        setRejectFor(null);
      }
    } catch (e: any) {
      if (mountedRef.current) {
        setActingOn(null);
        Alert.alert("Unable to reject", e?.message ?? "Try again.");
      }
    }
  };

  const onRefresh = () => {
    // realtime keeps fresh; just show a quick spinner for UX
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const isReady = useMemo(() => !!busId && pending !== null, [busId, pending]);

  /* Renderers */
  const renderItem = ({ item }: { item: BusChild }) => {
    const child = userCache[item.childUid];
    const parent = userCache[item.parentUid];
    const childName =
      child?.fullName ||
      [child?.firstName, child?.lastName].filter(Boolean).join(" ") ||
      "Child";
    const parentName =
      parent?.fullName ||
      [parent?.firstName, parent?.lastName].filter(Boolean).join(" ") ||
      "Parent";

    const disabled = actingOn === item.id;

    return (
      <View className="bg-white rounded-2xl p-4 mb-3 shadow">
        <Row>
          <View className="flex-1 pr-2">
            <Text className="text-[16px] font-semibold" numberOfLines={1}>
              {childName}
            </Text>
            <Text className="text-[12px] text-neutral-500" numberOfLines={1}>
              Requested by: {parentName}
            </Text>
          </View>
          <Pill label="Pending" tone="gray" />
        </Row>

        {!!(child as any)?.homeLocation?.address && (
          <View className="mt-2">
            <Text className="text-[12px] text-neutral-500" numberOfLines={1}>
              Home: {(child as any).homeLocation.address}
            </Text>
          </View>
        )}

        <View className="flex-row gap-3 mt-3">
          <TouchableOpacity
            onPress={() => approve(item)}
            disabled={disabled}
            className={`flex-1 rounded-xl py-2 items-center ${disabled ? "bg-emerald-300" : "bg-emerald-600"}`}
          >
            {disabled ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold">Approve</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openReject(item)}
            disabled={disabled}
            className={`flex-1 rounded-xl py-2 items-center ${disabled ? "bg-rose-300" : "bg-rose-600"}`}
          >
            <Text className="text-white font-semibold">Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      <FlatList
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <>
            <Header isCode={false} />
            <View className="mt-2 mb-3">
              <Text className="text-2xl font-light">Join Requests</Text>
              <Text className="text-[12px] text-neutral-500 mt-1">
                Review parent requests to add their child to your bus.
              </Text>
            </View>

            {loadingBus && (
              <View className="bg-white rounded-2xl p-4 mb-3 items-center">
                <ActivityIndicator />
                <Text className="text-neutral-500 mt-2">
                  Resolving your bus…
                </Text>
              </View>
            )}

            {!loadingBus && !busId && noBusFound && (
              <View className="bg-white rounded-2xl p-4 mb-3">
                <Text className="text-neutral-800 font-semibold">
                  No bus found for your account
                </Text>
                <Text className="text-neutral-500 text-xs mt-1">
                  Pass a ?busId=… in the URL or set ownerUid on your
                  busProfiles.
                </Text>
              </View>
            )}
          </>
        }
        data={!isReady ? [] : pending!}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          isReady ? (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Ionicons name="people-outline" size={26} color="#6b7280" />
              <Text className="text-neutral-700 mt-2">No pending requests</Text>
              <Text className="text-neutral-500 text-xs mt-1 text-center">
                You’ll see requests here when parents ask to join your bus.
              </Text>
            </View>
          ) : (
            <View className="items-center py-16">
              <ActivityIndicator />
              <Text className="text-neutral-500 mt-2">Loading…</Text>
            </View>
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Reject modal */}
      <Modal
        animationType="slide"
        transparent
        visible={!!rejectFor}
        onRequestClose={() => setRejectFor(null)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl px-4 pt-4 pb-6">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-lg font-semibold">Reject Request</Text>
              <TouchableOpacity onPress={() => setRejectFor(null)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-[12px] text-neutral-500 mb-2">
              (Optional) Add a reason to help parents understand why.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Type a short note…"
              className="min-h-[80px] bg-neutral-50 rounded-2xl px-3 py-2 text-[15px] border border-neutral-200"
              multiline
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => setRejectFor(null)}
                className="flex-1 items-center py-3 rounded-2xl bg-neutral-200"
              >
                <Text className="text-neutral-800">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmReject}
                disabled={actingOn === rejectFor?.id}
                className={`flex-1 items-center py-3 rounded-2xl ${actingOn === rejectFor?.id ? "bg-rose-300" : "bg-rose-600"}`}
              >
                {actingOn === rejectFor?.id ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BusJoinRequests;
