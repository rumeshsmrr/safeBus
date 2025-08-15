// app/busDetails.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import Header2 from "./Components/header2";

import { requestAddChildToBus } from "@/data/busChildren";
import { BusProfile, subscribeBusProfileById } from "@/data/busProfiles";
import { subscribeMyChildren } from "@/data/users";
import type { UserDoc } from "@/types/user";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

/* ----------------------------- small UI helpers ----------------------------- */
const Divider = () => <View className="h-[1px] bg-neutral-200 my-4" />;

const Chip = ({
  icon,
  text,
  tone = "neutral",
}: {
  icon?: React.ReactNode;
  text: string;
  tone?: "neutral" | "blue" | "green";
}) => {
  const toneCls =
    tone === "blue"
      ? "bg-blue-50 border-blue-200"
      : tone === "green"
        ? "bg-emerald-50 border-emerald-200"
        : "bg-neutral-50 border-neutral-200";
  const textCls =
    tone === "blue"
      ? "text-blue-700"
      : tone === "green"
        ? "text-emerald-700"
        : "text-neutral-700";
  return (
    <View
      className={`flex-row items-center gap-1 px-3 py-1.5 rounded-full border ${toneCls}`}
    >
      {icon}
      <Text className={`text-[12px] ${textCls}`} numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
};

const RoutePill = ({
  start,
  end,
}: {
  start?: string | null;
  end?: string | null;
}) => (
  <View className="flex-row items-center gap-2">
    <Chip
      tone="blue"
      icon={<Ionicons name="location-outline" size={14} color="#2563eb" />}
      text={start || "-"}
    />
    <MaterialCommunityIcons name="dots-horizontal" size={18} color="#9ca3af" />
    <Chip
      tone="green"
      icon={<Ionicons name="flag-outline" size={14} color="#047857" />}
      text={end || "-"}
    />
  </View>
);

const Stat = ({ value, label }: { value: string; label: string }) => (
  <View className="items-center px-3">
    <Text className="text-xl font-semibold text-neutral-900">{value}</Text>
    <Text className="text-[12px] text-neutral-500">{label}</Text>
  </View>
);

const Card = ({ children }: { children: React.ReactNode }) => (
  <View className="bg-white rounded-2xl p-5 shadow">{children}</View>
);

/* ---------------------------------- screen ---------------------------------- */

const scrollViewBottomPadding = 32;

const BusDetails = () => {
  const { docId } = useLocalSearchParams<{ docId: string }>();

  const [bus, setBus] = useState<(BusProfile & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // children / add-child
  const [children, setChildren] = useState<UserDoc[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);

  // rate driver
  const [isRateDriverVisible, setIsRateDriverVisible] = useState(false);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState<number | null>(
    null
  );
  const [driverRating, setDriverRating] = useState(0);

  // rate bus
  const [isRateBusVisible, setIsRateBusVisible] = useState(false);
  const [busRating, setBusRating] = useState(0);

  /* --------- data --------- */
  useEffect(() => {
    if (!docId) return;
    const unsub = subscribeBusProfileById(String(docId), (b) => {
      setBus(b);
      setLoading(false);
    });
    return () => unsub?.();
  }, [docId]);

  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => setChildren(kids));
    return () => unsub?.();
  }, []);

  /* --------- driver list (temporary) --------- */
  const driverList = useMemo(
    () => [
      { label: "Primary Driver", name: "Madusha Nayanajith", rating: 4.7 },
      { label: "Driver 1", name: "John Doe", rating: 4.5 },
      { label: "Driver 2", name: "Jane Smith", rating: 4.8 },
      { label: "Driver 3", name: "Alice Johnson", rating: 4.6 },
    ],
    []
  );

  /* --------- actions --------- */
  const sendAddChildRequest = async () => {
    if (!docId || !selectedChildUid) {
      Alert.alert("Select a child first");
      return;
    }
    try {
      await requestAddChildToBus(String(docId), selectedChildUid);
      Alert.alert("Request sent", "Your request is pending approval.");
      setIsAddChildModalVisible(false);
      setSelectedChildUid(null);
    } catch (e: any) {
      Alert.alert("Unable to request", e?.message ?? "Try again later.");
    }
  };

  const submitDriverRating = () => {
    if (selectedDriverIdx == null || driverRating === 0) {
      Alert.alert("Pick a driver and a rating");
      return;
    }
    const driver = driverList[selectedDriverIdx];
    console.log("Driver rating submitted:", { driver, rating: driverRating });
    setIsRateDriverVisible(false);
  };

  const submitBusRating = () => {
    if (busRating === 0) {
      Alert.alert("Pick a rating for the bus");
      return;
    }
    console.log("Bus rating submitted:", { busId: docId, rating: busRating });
    setIsRateBusVisible(false);
  };

  const callPhone = (phone?: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`).catch(() => {});
  };

  const renderStars = (value: number, setValue: (n: number) => void) =>
    [1, 2, 3, 4, 5].map((i) => (
      <TouchableOpacity key={i} onPress={() => setValue(i)} className="mx-2">
        <Ionicons
          name={i <= value ? "star" : "star-outline"}
          size={28}
          color={i <= value ? "#f59e0b" : "#d1d5db"}
        />
      </TouchableOpacity>
    ));

  /* ---------------------------- loading / empty ----------------------------- */

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#E7F1FF]">
        <Header2 />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-neutral-500 mt-2">Loading bus…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bus) {
    return (
      <SafeAreaView className="flex-1 bg-[#E7F1FF]">
        <Header2 />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg text-neutral-600">Bus not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const ratingAvg = (bus.ratingAvg ?? 0).toFixed(1);
  const ratingCount = bus.ratingCount ?? 0;

  /* ---------------------------------- UI ------------------------------------ */

  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      <Header2 />

      {/* Gradient header that also contains the action buttons */}
      <LinearGradient
        colors={["#D9E8FF", "#9fc3f5"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
        className="px-5 pt-4 pb-6"
      >
        <View className="flex-row items-start">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-2">
              <Text
                className="text-darkbg text-2xl font-semibold"
                numberOfLines={1}
              >
                {bus.busNickName || "Unnamed Bus"}
              </Text>
            </View>

            <View className="mt-1 flex-row items-center gap-2">
              <Ionicons name="card-outline" size={16} color="#111827" />
              <Text className="text-darkbg/90" numberOfLines={1}>
                {bus.busNumber || bus.busId}
              </Text>
            </View>

            <View className="mt-3">
              <RoutePill start={bus.startAddress} end={bus.endAddress} />
            </View>
          </View>

          {/* Compact rating */}
          <View className="items-end">
            <View className="bg-white/80 rounded-2xl px-3 py-2 items-end">
              <View className="flex-row items-center gap-1">
                <Ionicons name="star" size={16} color="#f59e0b" />
                <Text className="text-neutral-900 text-lg font-semibold">
                  {ratingAvg}
                </Text>
                <Text className="text-neutral-700">/5</Text>
              </View>
              <Text className="text-neutral-600 text-[11px]">
                {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons INSIDE the gradient */}
        <View className="flex-row flex-wrap gap-3 mt-4">
          <TouchableOpacity
            className="flex-1 rounded-2xl items-center justify-center py-4 shadow"
            style={{ backgroundColor: "#F8B959" }}
            onPress={() => Alert.alert("Notify Driver", "Coming soon")}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#1f2937"
              />
              <Text className="text-base text-gray-800">Notify Driver</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-1 rounded-2xl items-center justify-center py-4 shadow"
            style={{ backgroundColor: "#F85959" }}
            onPress={() => Alert.alert("Complaint", "Coming soon")}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons
                name="chatbox-ellipses-outline"
                size={18}
                color="#1f2937"
              />
              <Text className="text-base text-gray-800">Complain</Text>
            </View>
          </TouchableOpacity>

          {/* NEW: Rate Bus button */}
          <TouchableOpacity
            className="flex-1 rounded-2xl items-center justify-center py-4 shadow"
            style={{ backgroundColor: "#7dd3fc" }}
            onPress={() => {
              setBusRating(0);
              setIsRateBusVisible(true);
            }}
            activeOpacity={0.9}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="star-outline" size={18} color="#111827" />
              <Text className="text-base text-gray-800">Rate Bus</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        {/* FULL-WIDTH card under actions */}
        <View className="mt-5">
          <Card>
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person-outline" size={18} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-neutral-900 font-medium"
                  numberOfLines={1}
                >
                  {bus.firstName || bus.lastName
                    ? `${bus.firstName ?? ""} ${bus.lastName ?? ""}`.trim()
                    : "Contact"}
                </Text>
                <Text
                  className="text-neutral-500 text-[12px]"
                  numberOfLines={1}
                >
                  {bus.contactNumber || "-"}
                </Text>
              </View>
              <TouchableOpacity
                className={`px-3 py-2 rounded-xl ${bus.contactNumber ? "bg-blue-600" : "bg-neutral-300"}`}
                disabled={!bus.contactNumber}
                onPress={() => callPhone(bus.contactNumber)}
              >
                <Text className="text-white text-[12px]">Call</Text>
              </TouchableOpacity>
            </View>

            <Divider />

            <View className="flex-row justify-center">
              <Stat value={ratingAvg} label="Rating" />
              <View className="w-[1px] bg-neutral-200 mx-3" />
              <Stat value={String(ratingCount)} label="Reviews" />
            </View>
          </Card>
        </View>

        {/* Driver list (kept) */}
        <View className="mt-6">
          <Text className="text-xl font-semibold text-neutral-900 mb-2">
            Driver List
          </Text>
          <Card>
            {driverList.map((d, idx) => (
              <View key={idx}>
                <View className="flex-row items-center py-3">
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mr-3">
                    <Text className="text-neutral-600 font-semibold">
                      {d.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .slice(0, 2)
                        .join("")}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-neutral-900">{d.name}</Text>
                    <Text className="text-neutral-500 text-[12px]">
                      {d.label}
                    </Text>
                  </View>

                  <View className="items-end">
                    <View className="flex-row items-center gap-1">
                      <Ionicons name="star" size={14} color="#f59e0b" />
                      <Text className="text-neutral-900">
                        {d.rating.toFixed(1)} / 5
                      </Text>
                    </View>
                  </View>
                </View>
                {idx < driverList.length - 1 ? (
                  <View className="h-[1px] bg-neutral-100" />
                ) : null}
              </View>
            ))}

            <TouchableOpacity
              onPress={() => {
                setSelectedDriverIdx(null);
                setDriverRating(0);
                setIsRateDriverVisible(true);
              }}
              className="mt-4 bg-fuchsia-500 rounded-2xl py-3 items-center"
              activeOpacity={0.9}
            >
              <Text className="text-white font-semibold">Rate Driver</Text>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Add Child CTA */}
        <View className="mt-6 mb-2">
          <TouchableOpacity
            className="w-full rounded-2xl px-4 py-5 items-center justify-center shadow"
            style={{ backgroundColor: "#A9C9FB" }}
            onPress={() => setIsAddChildModalVisible(true)}
            activeOpacity={0.95}
          >
            <View className="flex-row items-center gap-2">
              <Ionicons name="add-circle-outline" size={20} color="#1f2937" />
              <Text className="text-lg text-gray-800">
                Add Child to this Bus
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isAddChildModalVisible}
        onRequestClose={() => setIsAddChildModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-2xl p-5 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-xl font-semibold">Select Child</Text>
              <TouchableOpacity
                onPress={() => setIsAddChildModalVisible(false)}
              >
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {children.length === 0 ? (
              <Text className="text-neutral-500 mb-4">
                No children linked to your account.
              </Text>
            ) : null}

            {children.map((child) => {
              const selected = selectedChildUid === child.uid;
              const name =
                child.fullName ||
                [child.firstName, child.lastName].filter(Boolean).join(" ") ||
                "Unnamed";

              return (
                <TouchableOpacity
                  key={child.uid}
                  className={`flex-row items-center mb-3 p-3 rounded-2xl border ${
                    selected
                      ? "bg-blue-50 border-blue-300"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                  onPress={() => setSelectedChildUid(child.uid)}
                  activeOpacity={0.9}
                >
                  <View className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-neutral-200">
                    <Image
                      source={images.childImage1}
                      className="w-full h-full"
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className="text-base text-neutral-900 font-medium"
                      numberOfLines={1}
                    >
                      {name}
                    </Text>
                    <Text className="text-xs text-neutral-500">
                      {child.currentBusId ? "Already linked" : "Not linked"}
                    </Text>
                  </View>
                  {selected ? (
                    <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            <View className="w-full flex-row mt-4 justify-between gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-3 rounded-2xl ${
                  selectedChildUid ? "bg-blue-600" : "bg-neutral-300"
                }`}
                onPress={sendAddChildRequest}
                disabled={!selectedChildUid}
              >
                <Text
                  className={`text-center text-base font-semibold ${
                    selectedChildUid ? "text-white" : "text-neutral-600"
                  }`}
                >
                  Send Request
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-3 rounded-2xl"
                onPress={() => setIsAddChildModalVisible(false)}
              >
                <Text className="text-white text-center text-base font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate Driver Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isRateDriverVisible}
        onRequestClose={() => setIsRateDriverVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-semibold">Rate Driver</Text>
              <TouchableOpacity onPress={() => setIsRateDriverVisible(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-[13px] text-neutral-500 mb-3">
              Select a driver and give your rating.
            </Text>

            {driverList.map((d, i) => {
              const selected = selectedDriverIdx === i;
              return (
                <TouchableOpacity
                  key={i}
                  className={`flex-row items-center mb-3 p-4 rounded-2xl border-2 ${
                    selected
                      ? "bg-blue-50 border-blue-500"
                      : "bg-neutral-50 border-neutral-200"
                  }`}
                  onPress={() => {
                    setSelectedDriverIdx(i);
                    setDriverRating(0);
                  }}
                  activeOpacity={0.9}
                >
                  <View className="w-10 h-10 rounded-full bg-neutral-100 items-center justify-center mr-3">
                    <Text className="text-neutral-600 font-semibold">
                      {d.name
                        .split(" ")
                        .map((n) => n.charAt(0))
                        .slice(0, 2)
                        .join("")}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-neutral-900 font-medium">
                      {d.name}
                    </Text>
                    <Text className="text-neutral-500 text-[12px]">
                      Current: {d.rating.toFixed(1)} / 5
                    </Text>
                  </View>
                  {selected ? (
                    <View className="w-6 h-6 bg-blue-600 rounded-full items-center justify-center">
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}

            {selectedDriverIdx != null && (
              <View className="mb-4 mt-1 items-center">
                <View className="flex-row items-center justify-center">
                  {renderStars(driverRating, setDriverRating)}
                </View>
                {driverRating > 0 ? (
                  <Text className="text-neutral-600 mt-2">
                    {driverRating} out of 5
                  </Text>
                ) : null}
              </View>
            )}

            <View className="w-full flex-row justify-between gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-4 rounded-2xl ${
                  selectedDriverIdx != null && driverRating > 0
                    ? "bg-blue-600"
                    : "bg-neutral-300"
                }`}
                onPress={submitDriverRating}
                disabled={selectedDriverIdx == null || driverRating === 0}
              >
                <Text
                  className={`text-center text-base font-semibold ${
                    selectedDriverIdx != null && driverRating > 0
                      ? "text-white"
                      : "text-neutral-600"
                  }`}
                >
                  Submit Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-4 rounded-2xl"
                onPress={() => setIsRateDriverVisible(false)}
              >
                <Text className="text-white text-center text-base font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rate Bus Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isRateBusVisible}
        onRequestClose={() => setIsRateBusVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-semibold">Rate Bus</Text>
              <TouchableOpacity onPress={() => setIsRateBusVisible(false)}>
                <Ionicons name="close" size={22} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text className="text-[13px] text-neutral-500 mb-3">
              Give an overall rating for this bus.
            </Text>

            <View className="mb-4 mt-1 items-center">
              <View className="flex-row items-center justify-center">
                {renderStars(busRating, setBusRating)}
              </View>
              {busRating > 0 ? (
                <Text className="text-neutral-600 mt-2">
                  {busRating} out of 5
                </Text>
              ) : null}
            </View>

            <View className="w-full flex-row justify-between gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-4 rounded-2xl ${
                  busRating > 0 ? "bg-blue-600" : "bg-neutral-300"
                }`}
                onPress={submitBusRating}
                disabled={busRating === 0}
              >
                <Text
                  className={`text-center text-base font-semibold ${
                    busRating > 0 ? "text-white" : "text-neutral-600"
                  }`}
                >
                  Submit Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-4 rounded-2xl"
                onPress={() => setIsRateBusVisible(false)}
              >
                <Text className="text-white text-center text-base font-semibold">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BusDetails;
