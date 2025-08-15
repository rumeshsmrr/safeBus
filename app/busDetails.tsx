// app/busDetails.tsx
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import Header2 from "./Components/header2"; // keep if you use it; or remove to rely on the greeting header

import { requestAddChildToBus } from "@/data/busChildren";
import { BusProfile, subscribeBusProfileById } from "@/data/busProfiles";
import { subscribeMyChildren } from "@/data/users";
import type { UserDoc } from "@/types/user";

// ----------- small helpers -----------
const todayLabel = () => {
  const d = new Date();
  const day = d.getDate();
  const shortMonth = d.toLocaleString("en-US", { month: "short" });
  const weekday = d.toLocaleString("en-US", { weekday: "long" });
  // “Today 25 Nov.” if it’s today; else “Mon 25 Nov.”
  const isToday =
    new Date().toDateString() === d.toDateString()
      ? "Today"
      : weekday.slice(0, 3);
  return `${isToday} ${day} ${shortMonth}.`;
};

const Divider = () => <View className="h-[1px] bg-gray-300 my-4" />;

const RouteIndicator = ({
  start,
  end,
}: {
  start?: string | null;
  end?: string | null;
}) => (
  <View className="flex-col items-end">
    <Text className="font-light text-grayText" numberOfLines={1}>
      {start || "-"}
    </Text>
    <View className="items-center my-1">
      <View className="w-[3px] h-10 bg-blue-700 rounded-full" />
    </View>
    <Text className="font-light text-grayText" numberOfLines={1}>
      {end || "-"}
    </Text>
  </View>
);

// ----------- main -----------
const scrollViewBottomPadding = 32;

const BusDetails = () => {
  const { busId } = useLocalSearchParams<{ busId: string }>();

  const [bus, setBus] = useState<(BusProfile & { id: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  // children / add-child flow
  const [children, setChildren] = useState<UserDoc[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);
  const [isAddChildModalVisible, setIsAddChildModalVisible] = useState(false);

  // rate driver flow
  const [isRateModelVisible, setIsRateModelVisible] = useState(false);
  const [selectedDriverIdx, setSelectedDriverIdx] = useState<number | null>(
    null
  );
  const [rating, setRating] = useState(0);

  // ---- subscribe to bus & children ----
  useEffect(() => {
    if (!busId) return;
    const unsub = subscribeBusProfileById(String(busId), (b) => {
      setBus(b);
      setLoading(false);
    });
    return () => unsub?.();
  }, [busId]);

  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => setChildren(kids));
    return () => unsub?.();
  }, []);

  // ---- hard-coded driver list for now ----
  const driverList = useMemo(
    () => [
      { label: "Primary Driver", name: "Madusha Nayanajith", rating: 4.7 },
      { label: "Driver 1", name: "John Doe", rating: 4.5 },
      { label: "Driver 2", name: "Jane Smith", rating: 4.8 },
      { label: "Driver 3", name: "Alice Johnson", rating: 4.6 },
    ],
    []
  );

  // ---- actions ----
  const sendAddChildRequest = async () => {
    if (!busId || !selectedChildUid) {
      Alert.alert("Select a child first");
      return;
    }
    try {
      await requestAddChildToBus(String(busId), selectedChildUid);
      Alert.alert("Request sent", "Your request is pending approval.");
      setIsAddChildModalVisible(false);
      setSelectedChildUid(null);
    } catch (e: any) {
      Alert.alert("Unable to request", e?.message ?? "Try again later.");
    }
  };

  const handleRatePress = () => {
    setSelectedDriverIdx(null);
    setRating(0);
    setIsRateModelVisible(true);
  };

  const handleSubmitRating = () => {
    if (selectedDriverIdx == null || rating === 0) {
      Alert.alert("Pick a driver and a rating");
      return;
    }
    const driver = driverList[selectedDriverIdx];
    console.log("Rating submitted:", { driver, rating });
    setIsRateModelVisible(false);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const active = i <= rating;
      stars.push(
        <TouchableOpacity key={i} onPress={() => setRating(i)} className="mx-1">
          <Text
            className={`text-3xl ${active ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-light-100">
        <Header2 />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
          <Text className="text-gray-500 mt-2">Loading bus…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!bus) {
    return (
      <SafeAreaView className="flex-1 bg-light-100">
        <Header2 />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-lg text-gray-600">Bus not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ----------- UI -----------
  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      {/* Optional: keep your old header as top chrome */}
      <Header2 />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        {/* Greeting header like the mock */}
        {/* <View className="bg-[#D8E9FF] rounded-2xl p-4 mt-3 flex-row items-center"> */}
        {/* <Image
            source={images.childImage1}
            className="w-10 h-10 rounded-full mr-3"
          />
          <View className="flex-1">
            <Text className="text-xl font-semibold">Hello, Parent</Text>
            <Text className="text-sm text-gray-500">{todayLabel()}</Text>
          </View>
          <View className="w-10 h-10 bg-white rounded-full items-center justify-center">
            <Text className="text-lg">🔔</Text>
          </View>
        </View> */}

        {/* The Bus title */}
        <Text className="text-2xl font-light mt-5 mb-2">The Bus</Text>

        {/* Main card */}
        <View className="bg-white rounded-2xl p-5 shadow">
          {/* Name + edit + route indicator */}
          <View className="flex-row items-start">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-2">
                <Text className="text-xl font-semibold" numberOfLines={1}>
                  {bus.busNickName || "Unnamed Bus"}
                </Text>
                <Text className="text-gray-400">✎</Text>
              </View>
              <Text className="text-base text-gray-600 mt-1" numberOfLines={1}>
                {bus.busNumber || bus.busId}
              </Text>
              {/* <Text className="text-base text-gray-600 mt-1" numberOfLines={1}>
                {bus.email || ""}
              </Text> */}
            </View>

            {/* Vertical route */}
            <RouteIndicator start={bus.startAddress} end={bus.endAddress} />
          </View>

          <Divider />

          {/* Driver list (hard-coded for now) */}
          <Text className="text-xl font-light">Driver List</Text>
          <View className="mt-3">
            {driverList.map((d, idx) => (
              <View key={idx} className="flex-row py-2 items-center">
                <View className="flex-1">
                  <Text className="text-grayText font-light">{d.label}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-grayText font-light">{d.name}</Text>
                </View>
                <View className="w-16 items-end">
                  <Text className="text-grayText font-light">
                    {d.rating.toFixed(1)} / 5
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <Divider />

          {/* Contact Info */}
          <Text className="text-xl font-light">Contact Info</Text>
          <View className="mt-3">
            <Text className="text-lg text-grayText font-light">
              {bus.firstName || bus.lastName
                ? `${bus.firstName ?? ""} ${bus.lastName ?? ""}`.trim()
                : "Contact"}
            </Text>
            <Text className="text-lg text-grayText font-light">
              {bus.contactNumber || "-"}
            </Text>
            {/* <Text className="text-lg text-blue-600 font-light">
              {bus.email || "-"}
            </Text> */}
            <Text
              className="text-lg text-grayText font-light"
              numberOfLines={2}
            >
              {`${bus.startAddress || ""}  —  ${bus.endAddress || ""}`}
            </Text>
          </View>
        </View>
        {/* Action buttons grid */}
        <View className="flex-row flex-wrap justify-between mt-8">
          <TouchableOpacity
            className="w-[48%] rounded-2xl px-4 py-6 mb-4 items-center justify-center"
            style={{ backgroundColor: "#F8B959" }}
            onPress={() => Alert.alert("Notify Driver", "Coming soon")}
          >
            <Text className="text-lg text-gray-800">Notify Driver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-2xl px-4 py-6 mb-4 items-center justify-center"
            style={{ backgroundColor: "#F85959" }}
            onPress={() => Alert.alert("Complaint", "Coming soon")}
          >
            <Text className="text-lg text-gray-800">Complain</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-2xl px-4 py-6 mb-4 items-center justify-center"
            style={{ backgroundColor: "#A9C9FB" }}
            onPress={() => setIsAddChildModalVisible(true)}
          >
            <Text className="text-lg text-gray-800">Add Child</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-[48%] rounded-2xl px-4 py-6 mb-2 items-center justify-center"
            style={{ backgroundColor: "#F292F1" }}
            onPress={handleRatePress}
          >
            <Text className="text-lg text-gray-800">Rate Driver</Text>
          </TouchableOpacity>
        </View>

        {/* (Optional) simple bottom nav mock (if you don’t already have tabs)
        <View className="mt-5 bg-[#0E59FF] rounded-3xl px-4 py-3 flex-row justify-around items-center">
          <Text className="text-white">Home</Text>
          <View className="bg-white rounded-full px-4 py-2">
            <Text className="text-[#0E59FF]">Bus</Text>
          </View>
          <Text className="text-white">Child</Text>
          <Text className="text-white">Profile</Text>
        </View>
        */}
      </ScrollView>

      {/* Add Child Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isAddChildModalVisible}
        onRequestClose={() => setIsAddChildModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-lg p-4 w-full max-w-md">
            <Text className="text-xl font-light mb-4">Select Child</Text>

            {children.length === 0 && (
              <Text className="text-gray-500 mb-4">
                No children linked to your account.
              </Text>
            )}

            {children.map((child) => (
              <TouchableOpacity
                key={child.uid}
                className={`flex-row items-center mb-3 p-3 rounded-lg ${
                  selectedChildUid === child.uid ? "bg-blue-50" : "bg-gray-50"
                }`}
                onPress={() => setSelectedChildUid(child.uid)}
              >
                <View className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                  <Image
                    source={images.childImage1}
                    className="w-full h-full"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-base text-gray-800 font-medium">
                    {child.fullName ||
                      [child.firstName, child.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      "Unnamed"}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {child.currentBusId ? "Already linked" : "Not linked"}
                  </Text>
                </View>
                {selectedChildUid === child.uid && (
                  <View className="w-6 h-6 bg-blue-500 rounded-full justify-center items-center">
                    <Text className="text-white text-xs">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            <View className="w-full flex-row mt-4 justify-between gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-3 rounded-lg ${
                  selectedChildUid ? "bg-blue-500" : "bg-gray-300"
                }`}
                onPress={sendAddChildRequest}
                disabled={!selectedChildUid}
              >
                <Text
                  className={`text-center text-lg font-light ${
                    selectedChildUid ? "text-white" : "text-gray-500"
                  }`}
                >
                  Send Request
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-3 rounded-lg"
                onPress={() => setIsAddChildModalVisible(false)}
              >
                <Text className="text-white text-center text-lg font-light">
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
        visible={isRateModelVisible}
        onRequestClose={() => setIsRateModelVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-md">
            <Text className="text-xl font-light mb-6">Rate Driver</Text>

            <Text className="text-lg font-medium mb-3">Select Driver:</Text>
            {driverList.map((d, i) => (
              <TouchableOpacity
                key={i}
                className={`flex-row items-center mb-3 p-4 rounded-lg border-2 ${
                  selectedDriverIdx === i
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 border-gray-200"
                }`}
                onPress={() => {
                  setSelectedDriverIdx(i);
                  setRating(0);
                }}
              >
                <View className="flex-1">
                  <Text className="text-lg text-gray-800 font-medium">
                    {d.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Current Rating: {d.rating.toFixed(1)} / 5
                  </Text>
                </View>
                {selectedDriverIdx === i && (
                  <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {selectedDriverIdx != null && (
              <View className="mb-6">
                <Text className="text-lg font-medium mb-3">Your Rating:</Text>
                <View className="flex-row justify-center items-center py-4">
                  {renderStars()}
                </View>
                {rating > 0 && (
                  <Text className="text-center text-gray-600 mt-2">
                    {rating} out of 5 stars
                  </Text>
                )}
              </View>
            )}

            <View className="w-full flex-row justify-between gap-3">
              <TouchableOpacity
                className={`flex-1 px-4 py-4 rounded-lg ${
                  selectedDriverIdx != null && rating > 0
                    ? "bg-blue-500"
                    : "bg-gray-300"
                }`}
                onPress={handleSubmitRating}
                disabled={selectedDriverIdx == null || rating === 0}
              >
                <Text
                  className={`text-center text-lg font-light ${
                    selectedDriverIdx != null && rating > 0
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  Submit Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-4 rounded-lg"
                onPress={() => setIsRateModelVisible(false)}
              >
                <Text className="text-white text-center text-lg font-light">
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
