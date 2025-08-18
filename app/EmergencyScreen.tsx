// app/EmergencyScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "@/app/lib/firebase";
import { images } from "@/constants/images";
import Header2 from "./Components/header2";

import { subscribeMyChildren, subscribeUserById } from "@/data/users";
import { displayNameOf, type UserDoc } from "@/types/user";

// If you already have this util, use it:
import { subscribeBusProfileById } from "@/data/busProfiles";

// Minimal bus profile shape we care about
type BusProfileLite = {
  id: string;
  busNumber?: string | null;
  busNickname?: string | null;
  driverName?: string | null;
  driverPhone?: string | null; // <-- preferred
  contactNumber?: string | null; // <-- fallback
};

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
    className={`px-3 py-1 rounded-full mr-2 mb-2 ${
      active ? "bg-blue-600" : "bg-gray-200"
    }`}
    activeOpacity={0.85}
  >
    <Text className={`${active ? "text-white" : "text-gray-800"} text-sm`}>
      {label}
    </Text>
  </TouchableOpacity>
);

const Card = ({
  title,
  subtitle,
  onPress,
  disabled = false,
}: {
  title: string;
  subtitle?: string;
  onPress: () => void;
  disabled?: boolean;
}) => (
  <TouchableOpacity
    className={`w-full rounded-xl shadow-md p-4 items-center justify-center mb-3 ${
      disabled ? "bg-gray-200" : "bg-white"
    }`}
    onPress={onPress}
    activeOpacity={0.85}
    disabled={disabled}
  >
    <Text className="text-xl text-darkbg font-bold">{title}</Text>
    {subtitle ? <Text className="text-darkbg mt-1">{subtitle}</Text> : null}
  </TouchableOpacity>
);

const EmergencyScreen = () => {
  const uid = auth.currentUser?.uid ?? null;

  const [parent, setParent] = useState<UserDoc | null>(null);
  const [kids, setKids] = useState<UserDoc[]>([]);
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);

  const selectedChild = useMemo(
    () => kids.find((k) => k.uid === selectedChildUid) ?? null,
    [kids, selectedChildUid]
  );

  const [bus, setBus] = useState<BusProfileLite | null>(null);
  const [loadingBus, setLoadingBus] = useState(false);

  // subscribe parent profile
  useEffect(() => {
    if (!uid) return;
    const unsub = subscribeUserById(uid, (u) => setParent(u));
    return () => unsub?.();
  }, [uid]);

  // subscribe children of parent
  useEffect(() => {
    const unsub = subscribeMyChildren((rows) => {
      setKids(rows);
      if (!selectedChildUid && rows.length > 0) {
        setSelectedChildUid(rows[0].uid);
      }
    });
    return () => unsub?.();
  }, []);

  // subscribe bus of selected child
  useEffect(() => {
    if (!selectedChild?.currentBusId) {
      setBus(null);
      return;
    }
    setLoadingBus(true);
    const unsub = subscribeBusProfileById(
      selectedChild.currentBusId,
      (b: any) => {
        // adapt to your existing bus profile shape
        const lite: BusProfileLite = {
          id: b?.id ?? selectedChild.currentBusId,
          busNumber: b?.busNumber ?? null,
          busNickname: b?.busNickname ?? null,
          driverName: b?.driverName ?? null,
          driverPhone: b?.driverPhone ?? b?.contactNumber ?? null,
          contactNumber: b?.contactNumber ?? null,
        };
        setBus(lite);
        setLoadingBus(false);
      }
    );
    return () => unsub?.();
  }, [selectedChild?.currentBusId]);

  // ---- Dial helpers ----

  const openEmptyDialPad = async () => {
    // Try tel: then tel:// as a fallback
    try {
      const ok = await Linking.canOpenURL("tel:");
      if (ok) return Linking.openURL("tel:");
    } catch {}
    try {
      const ok2 = await Linking.canOpenURL("tel://");
      if (ok2) return Linking.openURL("tel://");
    } catch {}
    Alert.alert(
      "Error",
      "Could not open the dialer. Please check your device settings."
    );
  };

  const makeCall = async (phone?: string | null) => {
    const trimmed = (phone ?? "").toString().trim();
    if (!trimmed) {
      return openEmptyDialPad();
    }
    try {
      const url = `tel:${trimmed}`;
      const ok = await Linking.canOpenURL(url);
      if (!ok) return openEmptyDialPad();
      await Linking.openURL(url);
    } catch (err) {
      console.error("Failed to open dialer:", err);
      openEmptyDialPad();
    }
  };

  // ---- Derived display data ----

  const childName = (selectedChild && displayNameOf(selectedChild)) || "Child";

  // If you store a direct child phone, prefer it; otherwise there may be none.
  const childPhone = selectedChild?.studentPhone ?? null; // add more fallbacks if you store them

  const parentPhone = parent?.contactNumber ?? null;
  const trustedPhone = parent?.trustedContactNumber ?? null;

  const busLabel = bus
    ? `${bus.busNumber ? `Bus ${bus.busNumber}` : "Bus"}${
        bus.busNickname ? ` • ${bus.busNickname}` : ""
      }`
    : "Bus";
  const busPhone = bus?.driverPhone || bus?.contactNumber || null;

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
        <Text className="text-2xl font-light mt-4">Emergency</Text>

        {/* Child selector */}
        <Text className="text-sm text-gray-600 mt-3">Choose your child</Text>
        <View className="flex-row flex-wrap mt-2">
          {kids.length === 0 ? (
            <Text className="text-gray-500 mt-1">No children linked.</Text>
          ) : (
            kids.map((k) => (
              <Chip
                key={k.uid}
                label={displayNameOf(k)}
                active={selectedChildUid === k.uid}
                onPress={() => setSelectedChildUid(k.uid)}
              />
            ))
          )}
        </View>

        {/* Quick cards */}
        <View className="mt-6">
          <Card
            title="Contact Child"
            subtitle={
              childPhone ? `${childName} • ${childPhone}` : `${childName}`
            }
            onPress={() => makeCall(childPhone)}
          />

          <Card
            title="Contact Trusted"
            subtitle={trustedPhone ? trustedPhone : "No trusted number saved"}
            onPress={() => makeCall(trustedPhone)}
          />

          <Card
            title="Contact Bus Driver"
            subtitle={
              loadingBus
                ? "Loading bus…"
                : busPhone
                  ? `${busLabel} • ${busPhone}`
                  : bus
                    ? busLabel
                    : "No bus linked"
            }
            onPress={() => makeCall(busPhone)}
            disabled={loadingBus}
          />

          <View className="flex-row items-center justify-between w-full mt-3">
            <TouchableOpacity
              className="w-[48%] h-[80px] bg-red-200 rounded-xl shadow-md p-4 items-center justify-center"
              onPress={() => makeCall("119")}
              activeOpacity={0.85}
            >
              <Text className="text-3xl text-darkbg font-bold">119</Text>
              <Text className="text-darkbg mt-1">Police</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[48%] h-[80px] bg-blue-200 rounded-xl shadow-md p-4 items-center justify-center"
              onPress={() => makeCall("1990")}
              activeOpacity={0.85}
            >
              <Text className="text-3xl text-darkbg font-bold">1990</Text>
              <Text className="text-darkbg mt-1">Ambulance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Decorative / spacer image (optional) */}
        <Image
          source={images.bgchilds}
          className="w-full h-56 mt-8"
          resizeMode="contain"
        />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EmergencyScreen;
