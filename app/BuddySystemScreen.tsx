// app/BuddySystemScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import Header2 from "./Components/header2";

import {
  respondToBuddyRequest,
  sendBuddyRequest,
  setBuddyActive,
  subscribeIncomingRequests,
  subscribeMyBuddyLinks,
  subscribeMyChildren,
  subscribePeersOnBus,
} from "@/data/buddy";

import type { BuddyLinkDoc, PeerStudent } from "@/types/buddy";

const scrollViewBottomPadding = 24;

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

const SkeletonRow = () => (
  <View className="bg-white rounded-2xl p-4 w-full shadow mb-3">
    <View className="flex-row items-center gap-3">
      <View className="w-12 h-12 bg-gray-200/60 rounded-full" />
      <View className="flex-1">
        <View className="h-4 bg-gray-200/60 rounded mb-2 w-2/3" />
        <View className="h-3 bg-gray-200/60 rounded w-1/3" />
      </View>
    </View>
  </View>
);

const BuddySystemScreen = () => {
  // Children of current parent
  const [kids, setKids] = useState<PeerStudent[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);
  const selectedChild = useMemo(
    () => kids.find((k) => k.uid === selectedChildUid) ?? null,
    [kids, selectedChildUid]
  );

  // Peers on same bus
  const [peers, setPeers] = useState<PeerStudent[]>([]);
  const [loadingPeers, setLoadingPeers] = useState(true);

  // Buddy links (mine) and incoming requests
  const [links, setLinks] = useState<BuddyLinkDoc[]>([]);
  const [incoming, setIncoming] = useState<BuddyLinkDoc[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [loadingIncoming, setLoadingIncoming] = useState(true);

  // UI state for sending request
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [pendingPeer, setPendingPeer] = useState<PeerStudent | null>(null);
  const [sending, setSending] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Subscribe my children
  useEffect(() => {
    const unsub = subscribeMyChildren((rows) => {
      setKids(rows);
      if (!selectedChildUid && rows.length > 0)
        setSelectedChildUid(rows[0].uid);
    });
    return () => unsub?.();
  }, []);

  // Subscribe my buddy links (all)
  useEffect(() => {
    setLoadingLinks(true);
    const unsub = subscribeMyBuddyLinks((rows) => {
      setLinks(rows);
      setLoadingLinks(false);
    });
    return () => unsub?.();
  }, []);

  // Subscribe incoming requests (to confirm/reject)
  useEffect(() => {
    setLoadingIncoming(true);
    const unsub = subscribeIncomingRequests((rows) => {
      setIncoming(rows);
      setLoadingIncoming(false);
    });
    return () => unsub?.();
  }, []);

  // Subscribe peers on the same bus as selected child
  useEffect(() => {
    if (!selectedChild?.currentBusId) {
      setPeers([]);
      setLoadingPeers(false);
      return;
    }
    setLoadingPeers(true);
    const unsub = subscribePeersOnBus(
      selectedChild.currentBusId,
      selectedChild.uid,
      (rows) => {
        setPeers(rows);
        setLoadingPeers(false);
      }
    );
    return () => unsub?.();
  }, [selectedChild?.uid, selectedChild?.currentBusId]);

  // Derived sets for current child
  const childBuddyLinks = useMemo(() => {
    if (!selectedChildUid) return [];
    return links.filter((l) => l.childUids.includes(selectedChildUid));
  }, [links, selectedChildUid]);

  const activeBuddies = useMemo(
    () => childBuddyLinks.filter((l) => l.status === "active"),
    [childBuddyLinks]
  );

  const pendingWithChild = useMemo(() => {
    if (!selectedChildUid) return new Set<string>();
    const s = new Set<string>();
    childBuddyLinks.forEach((l) => {
      const peerId =
        l.childUids[0] === selectedChildUid ? l.childUids[1] : l.childUids[0];
      if (l.status === "pending") s.add(peerId);
      if (l.status === "active") s.add(peerId);
    });
    return s;
  }, [childBuddyLinks, selectedChildUid]);

  // Actions
  function openSendModal(peer: PeerStudent) {
    setPendingPeer(peer);
    setIsModalVisible(true);
  }
  function closeSendModal() {
    if (sending) return;
    setIsModalVisible(false);
    setPendingPeer(null);
  }
  async function confirmSend() {
    if (!pendingPeer || !selectedChildUid) return;
    try {
      setSending(true);
      await sendBuddyRequest(selectedChildUid, pendingPeer.uid);
      closeSendModal();
    } catch (e: any) {
      alert(e?.message ?? "Failed to send request");
    } finally {
      setSending(false);
    }
  }
  async function toggleActive(link: BuddyLinkDoc) {
    try {
      setTogglingId(link.id);
      await setBuddyActive(link.id, !link.active);
    } catch (e: any) {
      alert(e?.message ?? "Failed to update");
    } finally {
      setTogglingId(null);
    }
  }
  async function respond(linkId: string, accept: boolean) {
    try {
      setRespondingId(linkId);
      await respondToBuddyRequest(linkId, accept);
    } catch (e: any) {
      alert(e?.message ?? "Failed to update request");
    } finally {
      setRespondingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Text className="text-2xl font-semibold mt-2">Buddy System</Text>

        {/* Child selector */}
        <Text className="text-sm text-gray-600 mt-2">Choose your child</Text>
        <View className="flex-row flex-wrap mt-2">
          {kids.length === 0 ? (
            <Text className="text-gray-500 mt-1">No children linked.</Text>
          ) : (
            kids.map((k) => (
              <Chip
                key={k.uid}
                label={k.fullName ?? "Student"}
                active={selectedChildUid === k.uid}
                onPress={() => setSelectedChildUid(k.uid)}
              />
            ))
          )}
        </View>

        {/* Active Buddies */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-medium">Your Child’s Buddies</Text>
            {loadingLinks ? <ActivityIndicator /> : null}
          </View>

          {loadingLinks ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : activeBuddies.length === 0 ? (
            <View className="w-full items-start justify-center py-4">
              <Text className="text-gray-500">No buddies yet.</Text>
            </View>
          ) : (
            activeBuddies.map((l) => {
              const peerChildUid =
                selectedChildUid && l.childUids[0] === selectedChildUid
                  ? l.childUids[1]
                  : l.childUids[0];
              return (
                <View
                  key={l.id}
                  className="flex-col items-center mt-3 bg-white p-4 rounded-lg shadow-sm w-full"
                >
                  <View className="w-full flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={images.childImage1}
                        className="w-12 h-12 rounded-full"
                      />
                      <View>
                        <Text className="text-base font-semibold">
                          Buddy child:{" "}
                          {l.requestedChildName ||
                            l.requesterChildName ||
                            peerChildUid}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {l.busNumber ? `Bus ${l.busNumber}` : "Bus —"}
                          {l.busNickname ? ` • ${l.busNickname}` : ""}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      text={l.active ? "Active" : "Inactive"}
                      tone={l.active ? "green" : "gray"}
                    />
                  </View>

                  <View className="w-full flex-row justify-end mt-3">
                    <TouchableOpacity
                      className={`px-4 py-2 rounded-lg ${togglingId === l.id ? "bg-blue-600/70" : "bg-blue-600"}`}
                      onPress={() => toggleActive(l)}
                      disabled={togglingId === l.id}
                      activeOpacity={0.85}
                    >
                      {togglingId === l.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white">
                          {l.active ? "Pause" : "Resume"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Incoming Requests — SHOWS bus number + nickname + child + parent */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-medium">New Buddy Requests</Text>
            {loadingIncoming ? <ActivityIndicator /> : null}
          </View>

          {loadingIncoming ? (
            <SkeletonRow />
          ) : incoming.length === 0 ? (
            <View className="w-full items-start justify-center py-4">
              <Text className="text-gray-500">No new requests.</Text>
            </View>
          ) : (
            incoming.map((l) => {
              const fallbackPeerChildUid =
                selectedChildUid && l.childUids[0] === selectedChildUid
                  ? l.childUids[1]
                  : l.childUids[0];

              const childName = l.requesterChildName || fallbackPeerChildUid;
              const parentName = l.requesterParentName || l.requesterParentUid;

              const busText =
                (l.busNumber
                  ? `Bus ${l.busNumber}`
                  : l.busId
                    ? `Bus ${l.busId}`
                    : "Bus —") + (l.busNickname ? ` • ${l.busNickname}` : "");

              return (
                <View
                  key={l.id}
                  className="flex-col items-center mt-3 bg-white p-4 rounded-lg shadow-sm w-full"
                >
                  <View className="w-full flex-row items-start justify-between">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={images.childImage1}
                        className="w-12 h-12 rounded-full"
                      />
                      <View>
                        <Text className="text-base font-semibold">
                          Request to pair with: {childName}
                        </Text>
                        <Text className="text-gray-700 text-sm mt-0.5">
                          Parent: {parentName}
                        </Text>
                        <Text className="text-gray-500 text-xs mt-0.5">
                          {busText}
                        </Text>
                      </View>
                    </View>
                    <Badge text="Pending" tone="blue" />
                  </View>

                  <View className="flex-row w-full justify-end gap-2 mt-3">
                    <TouchableOpacity
                      className={`px-4 py-2 rounded-lg ${respondingId === l.id ? "bg-red-600/70" : "bg-red-600"}`}
                      onPress={() => respond(l.id, false)}
                      disabled={respondingId === l.id}
                      activeOpacity={0.85}
                    >
                      {respondingId === l.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white">Reject</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`px-4 py-2 rounded-lg ${respondingId === l.id ? "bg-green-600/70" : "bg-green-600"}`}
                      onPress={() => respond(l.id, true)}
                      disabled={respondingId === l.id}
                      activeOpacity={0.85}
                    >
                      {respondingId === l.id ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text className="text-white">Confirm</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Find a Buddy */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-medium">Find a Buddy</Text>
            {loadingPeers ? <ActivityIndicator /> : null}
          </View>

          {loadingPeers ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : peers.length === 0 ? (
            <View className="w-full items-start justify-center py-4">
              <Text className="text-gray-500">No peers on this bus yet.</Text>
            </View>
          ) : (
            peers.map((p) => {
              const already = pendingWithChild.has(p.uid);
              return (
                <View
                  key={p.uid}
                  className="flex-col items-center mt-3 bg-white p-4 rounded-lg shadow-sm w-full"
                >
                  <View className="flex-row items-center w-full justify-between">
                    <View className="flex-row items-center gap-3">
                      <Image
                        source={images.childImage1}
                        className="w-12 h-12 rounded-full"
                      />
                      <View>
                        <Text className="text-base font-semibold">
                          {p.fullName ?? p.uid}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                          {p.parentUid ? "Parent linked" : "No parent linked"}
                        </Text>
                      </View>
                    </View>
                    {already ? (
                      <Badge text="Requested/Active" tone="gray" />
                    ) : (
                      <TouchableOpacity
                        className="bg-blue-600 px-4 py-2 rounded-lg"
                        onPress={() => openSendModal(p)}
                        activeOpacity={0.85}
                      >
                        <Text className="text-white">Send Request</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Send request modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isModalVisible}
        onRequestClose={closeSendModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white p-4 rounded-2xl w-full max-w-md">
            <Text className="text-lg font-semibold mb-2">
              Send Buddy Request
            </Text>
            <Text className="text-gray-600 mb-4">
              {pendingPeer
                ? `Send a request to pair with ${pendingPeer.fullName ?? pendingPeer.uid}?`
                : ""}
            </Text>
            <View className="flex-row justify-end gap-2">
              <TouchableOpacity
                className="bg-gray-500 px-4 py-2 rounded-lg"
                onPress={closeSendModal}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`px-4 py-2 rounded-lg ${sending ? "bg-blue-600/70" : "bg-blue-600"}`}
                onPress={confirmSend}
                disabled={sending}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white">Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BuddySystemScreen;
