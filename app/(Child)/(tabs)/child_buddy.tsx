import Header from "@/app/Components/header";
import { db } from "@/app/lib/firebase";
import { images } from "@/constants/images";
import { getBusMeta } from "@/data/busProfiles";
import {
  getCurrentUserProfile,
  getDisplayName,
  subscribeMyChildren,
} from "@/data/users";
import type { BuddyLinkDoc } from "@/types/buddy";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type Unsubscribe,
} from "firebase/firestore";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const scrollViewBottomPadding = 24;

/** Small pill button for child selection (only shown if parent has multiple kids) */
const Chip = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-3 py-1 rounded-full mr-2 mb-2 ${active ? "bg-blue-600" : "bg-gray-200"}`}
    activeOpacity={0.85}
  >
    <Text className={`${active ? "text-white" : "text-gray-800"} text-sm`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Badge = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "green" | "blue" | "gray" | "red";
}) => {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <View className={`px-3 py-1 rounded-full ${map[tone]}`}>
      <Text className="text-xs font-semibold">{text}</Text>
    </View>
  );
};

const SkeletonCard = () => (
  <View className="w-full bg-white rounded-2xl shadow p-6 mb-4">
    <View className="flex-row items-center justify-between mb-4">
      <View className="w-20 h-6 bg-gray-200/70 rounded-full" />
      <View className="w-24 h-7 bg-gray-200/70 rounded-full" />
    </View>
    <View className="flex-row items-center">
      <View className="w-20 h-20 rounded-full bg-gray-200/70" />
      <View className="flex-1 ml-4">
        <View className="h-5 bg-gray-200/70 rounded w-40 mb-2" />
        <View className="h-4 bg-gray-200/70 rounded w-56 mb-1" />
        <View className="h-4 bg-gray-200/70 rounded w-24" />
      </View>
    </View>
  </View>
);

type BusMeta = { busNumber: string | null; busNickname: string | null };

const ChildBuddyScreen = () => {
  /** Who is logged in? Could be a student or a parent */
  const [profileLoading, setProfileLoading] = useState(true);
  const [role, setRole] = useState<"student" | "parent" | "bus" | null>(null);
  const [myUid, setMyUid] = useState<string | null>(null);

  /** If parent: their children. If student: this stays empty and we set selectedChildUid = myUid */
  const [kids, setKids] = useState<{ uid: string; fullName: string | null }[]>(
    []
  );
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);

  /** Active buddy links for the selected child */
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [activeLinks, setActiveLinks] = useState<BuddyLinkDoc[]>([]);

  /** Fallback caches for names/bus meta when not denormalized on the link */
  const [nameCache, setNameCache] = useState<Record<string, string>>({});
  const [busCache, setBusCache] = useState<Record<string, BusMeta>>({});

  // Load current profile -> decide child context
  useEffect(() => {
    let unsubKids: Unsubscribe | null = null;
    (async () => {
      setProfileLoading(true);
      const me = await getCurrentUserProfile();
      const r = (me?.role as any) ?? null;
      setRole(r);
      setMyUid(me?.uid ?? null);

      if (r === "student" && me?.uid) {
        // Student: use own uid as selected child
        setSelectedChildUid(me.uid);
        setKids([]); // not needed
      } else if (r === "parent") {
        // Parent: subscribe to children
        unsubKids = subscribeMyChildren((rows) => {
          const mapped = rows.map((k) => ({
            uid: k.uid,
            fullName: k.fullName ?? null,
          }));
          setKids(mapped);
          // default select first child if none selected yet
          setSelectedChildUid((prev) => prev ?? mapped[0]?.uid ?? null);
        });
      } else {
        // Bus or unknown role: no child context
        setSelectedChildUid(null);
      }
      setProfileLoading(false);
    })();
    return () => unsubKids?.();
  }, []);

  // Subscribe to active buddy links for the selected child
  useEffect(() => {
    if (!selectedChildUid) {
      setActiveLinks([]);
      setLoadingLinks(false);
      return;
    }
    setLoadingLinks(true);
    const qy = query(
      collection(db, "buddyLinks"),
      where("childUids", "array-contains", selectedChildUid),
      where("status", "==", "active")
    );
    const unsub = onSnapshot(qy, (qs) => {
      const rows = qs.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      })) as BuddyLinkDoc[];
      setActiveLinks(rows);
      setLoadingLinks(false);
    });
    return () => unsub();
  }, [selectedChildUid]);

  // Hydrate missing display names and bus meta for cards (fallbacks for older docs)
  useEffect(() => {
    if (activeLinks.length === 0) return;

    const needChildNames = new Set<string>();
    const needParentNames = new Set<string>();
    const needBusIds = new Set<string>();

    activeLinks.forEach((l) => {
      // peer child uid for this selected child
      if (!selectedChildUid) return;
      const peerUid =
        l.childUids[0] === selectedChildUid ? l.childUids[1] : l.childUids[0];

      if (
        !l.requesterChildName &&
        !l.requestedChildName &&
        !nameCache[peerUid]
      ) {
        needChildNames.add(peerUid);
      }
      if (!l.requesterParentName && !nameCache[l.requesterParentUid]) {
        needParentNames.add(l.requesterParentUid);
      }
      if (!l.requestedParentName && !nameCache[l.requestedParentUid]) {
        needParentNames.add(l.requestedParentUid);
      }
      if (l.busId && !(l.busId in busCache) && !l.busNumber && !l.busNickname) {
        needBusIds.add(l.busId);
      }
    });

    if (needChildNames.size + needParentNames.size + needBusIds.size === 0)
      return;

    (async () => {
      const newNames: Record<string, string> = {};
      const newBus: Record<string, BusMeta> = {};

      // child names
      await Promise.all(
        Array.from(needChildNames).map(async (uid) => {
          try {
            const snap = await getDoc(doc(db, "users", uid));
            const d: any = snap.data();
            newNames[uid] = d?.fullName || uid;
          } catch {
            newNames[uid] = uid;
          }
        })
      );
      // parent names
      await Promise.all(
        Array.from(needParentNames).map(async (uid) => {
          try {
            const dn = await getDisplayName(uid);
            newNames[uid] = dn || uid;
          } catch {
            newNames[uid] = uid;
          }
        })
      );
      // bus meta
      await Promise.all(
        Array.from(needBusIds).map(async (busId) => {
          try {
            const meta = await getBusMeta(busId);
            newBus[busId] = {
              busNumber: meta?.busNumber ?? null,
              busNickname: meta?.busNickname ?? null,
            };
          } catch {
            newBus[busId] = { busNumber: null, busNickname: null };
          }
        })
      );

      setNameCache((prev) => ({ ...prev, ...newNames }));
      setBusCache((prev) => ({ ...prev, ...newBus }));
    })();
  }, [activeLinks, selectedChildUid, nameCache, busCache]);

  // Derived pretty cards
  const cards = useMemo(() => {
    if (!selectedChildUid) return [];
    return activeLinks.map((l) => {
      const peerUid =
        l.childUids[0] === selectedChildUid ? l.childUids[1] : l.childUids[0];

      const childName =
        l.requestedChildName ||
        l.requesterChildName ||
        nameCache[peerUid] ||
        peerUid;

      // Show the *other* parent on the card (the buddy's parent)
      const buddyParentUid =
        l.requestedParentUid && l.parentUids.includes(l.requestedParentUid)
          ? l.requestedParentUid
          : l.requesterParentUid;
      const parentName =
        (l.requestedParentUid === buddyParentUid
          ? l.requestedParentName
          : l.requesterParentName) ||
        nameCache[buddyParentUid] ||
        buddyParentUid;

      const busMeta: BusMeta | undefined =
        l.busNumber || l.busNickname
          ? {
              busNumber: l.busNumber ?? null,
              busNickname: l.busNickname ?? null,
            }
          : l.busId
            ? busCache[l.busId]
            : undefined;

      const busText =
        (busMeta?.busNumber
          ? `Bus ${busMeta.busNumber}`
          : l.busId
            ? `Bus ${l.busId}`
            : "Bus —") +
        (busMeta?.busNickname ? ` • ${busMeta.busNickname}` : "");

      return {
        id: l.id,
        status: l.active ? "Active" : "Inactive",
        tone: l.active ? "green" : "gray",
        childName,
        parentName,
        busText,
      };
    });
  }, [activeLinks, selectedChildUid, nameCache, busCache]);

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
        <Text className="text-2xl font-semibold mt-4">Your Buddy</Text>

        {/* If parent and has multiple kids, allow selecting which child's buddy to view */}
        {role === "parent" && kids.length > 0 ? (
          <>
            <Text className="text-sm text-gray-600 mt-2">
              Choose your child
            </Text>
            <View className="flex-row flex-wrap mt-2">
              {kids.map((k) => (
                <Chip
                  key={k.uid}
                  label={k.fullName ?? "Student"}
                  active={selectedChildUid === k.uid}
                  onPress={() => setSelectedChildUid(k.uid)}
                />
              ))}
            </View>
          </>
        ) : null}

        <View className="flex-col items-center justify-center mt-4 gap-2">
          {profileLoading || loadingLinks ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : cards.length === 0 ? (
            <View className="w-full bg-white rounded-2xl shadow p-6 mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold text-gray-800">
                  No Buddy Linked
                </Text>
                <Badge text="None" tone="gray" />
              </View>
              <Text className="text-gray-500">
                Once another parent confirms a buddy request with your child, it
                will appear here.
              </Text>
            </View>
          ) : (
            cards.map((card) => (
              <View
                key={card.id}
                className="w-full bg-white rounded-2xl shadow p-6 mb-4"
              >
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-gray-800">
                    Buddy Pair
                  </Text>
                  <Badge text={card.status} />
                </View>

                <View className="flex-row items-center">
                  <View className="relative">
                    <Image
                      source={images.childImage1}
                      className="w-20 h-20 rounded-full border-4 border-blue-500"
                    />
                  </View>

                  <View className="flex-1 ml-4">
                    <Text className="text-2xl font-bold text-gray-800 mb-1">
                      {card.childName}
                    </Text>
                    <Text className="text-base text-gray-600 mb-1">
                      Parent:{" "}
                      <Text className="font-medium text-gray-800">
                        {card.parentName}
                      </Text>
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {card.busText}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChildBuddyScreen;
