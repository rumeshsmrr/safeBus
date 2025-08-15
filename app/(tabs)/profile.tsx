// app/ParentProfile.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { auth } from "@/app/lib/firebase";
import { signOut } from "firebase/auth";

import { images } from "@/constants/images"; // fallback avatar used below
import { subscribeMyChildren, subscribeUserById } from "@/data/users";
import type { UserDoc } from "@/types/user";
import { displayNameOf } from "@/types/user";

const Banner = ({ name, email }: { name: string; email?: string | null }) => (
  <LinearGradient
    colors={["#c9e0ff", "#e7f1ff"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={{ borderRadius: 20 }}
    className="w-full overflow-hidden"
  >
    <View className="flex-row items-center p-5">
      <Image
        source={images?.childImage1 ?? { uri: "https://picsum.photos/100" }}
        className="w-14 h-14 rounded-full mr-4 bg-white"
      />
      <View className="flex-1">
        <Text className="text-2xl font-semibold" numberOfLines={1}>
          {name}
        </Text>
        {email ? (
          <Text className="text-sm text-gray-600" numberOfLines={1}>
            {email}
          </Text>
        ) : null}
      </View>
      <View className="bg-white rounded-full px-3 py-1">
        <Text className="text-xs text-gray-700">Parent</Text>
      </View>
    </View>
  </LinearGradient>
);

const StatCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <View className="flex-1 bg-white rounded-2xl p-4 shadow items-center">
    <Text className="text-2xl font-semibold">{value}</Text>
    <Text className="text-gray-500 mt-1">{label}</Text>
  </View>
);

const ActionTile = ({
  title,
  color,
  onPress,
}: {
  title: string;
  color: string;
  onPress: () => void;
}) => (
  <TouchableOpacity
    className="w-[48%] rounded-2xl px-4 py-6 mb-4 items-center justify-center shadow"
    style={{ backgroundColor: color }}
    onPress={onPress}
  >
    <Text className="text-base text-gray-800">{title}</Text>
  </TouchableOpacity>
);

const ParentProfile = () => {
  const [me, setMe] = useState<UserDoc | null>(null);
  const [children, setChildren] = useState<UserDoc[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to my profile
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const unsub = subscribeUserById(uid, (u) => {
      setMe(u);
      setLoading(false);
    });
    return () => unsub?.();
  }, []);

  // Subscribe to my children for live count
  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => setChildren(kids));
    return () => unsub?.();
  }, []);

  const name = useMemo(() => displayNameOf(me ?? {}), [me]);
  const email = me?.email ?? null;
  const parentCode = me?.parentCode ?? "-";
  const childrenCount = children?.length ?? 0;

  const handleCopyCode = async () => {
    if (!me?.parentCode) return;
    await Clipboard.setStringAsync(me.parentCode);
    Alert.alert("Copied", "Parent code copied to clipboard.");
  };

  const handleShareCode = async () => {
    if (!me?.parentCode) return;
    try {
      await Share.share({
        message: `Join my child's bus on SafeBus.\nParent Code: ${me.parentCode}`,
      });
    } catch {}
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      await signOut(auth);
      router.replace("/LogingScreen"); // keep your route name
    } catch (e: any) {
      Alert.alert("Logout failed", e?.message ?? "Try again.");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {/* Header / Banner */}
        <Banner name={name} email={email} />

        {/* Loading state */}
        {loading && (
          <View className="items-center justify-center py-10">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading profile…</Text>
          </View>
        )}

        {/* Stats */}
        {!loading && (
          <View className="flex-row gap-3 mt-4">
            <StatCard label="Children" value={childrenCount} />
            <StatCard
              label="Parent Code"
              value={parentCode !== "-" ? "Active" : "—"}
            />
          </View>
        )}

        {/* Parent Code Card */}
        {!loading && (
          <View className="bg-white rounded-2xl p-5 mt-4 shadow">
            <Text className="text-lg font-medium">Your Parent Code</Text>
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-2xl tracking-widest font-semibold">
                {parentCode}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={handleCopyCode}
                  className="bg-gray-100 rounded-xl px-3 py-2"
                  disabled={!me?.parentCode}
                >
                  <Text className="text-gray-800">Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleShareCode}
                  className="bg-gray-100 rounded-xl px-3 py-2"
                  disabled={!me?.parentCode}
                >
                  <Text className="text-gray-800">Share</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-gray-500 mt-2">
              Share this code with your bus driver to link your child.
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        {!loading && (
          <View className="mt-6">
            <Text className="text-xl font-light mb-3">Quick Actions</Text>
            <View className="flex-row flex-wrap justify-between">
              <ActionTile
                title="Manage Children"
                color="#A9C9FB"
                onPress={() => router.push("/(tabs)/child")}
              />
              <ActionTile
                title="Find Bus"
                color="#F8B959"
                onPress={() => router.push("/(tabs)/bus")}
              />
              {/* <ActionTile
                title="Edit Profile"
                color="#D9F7BE"
                onPress={() => router.push("/EditProfile")} // create later
              /> */}
              <ActionTile
                title="Help & Support"
                color="#FFD6E7"
                onPress={() => Alert.alert("Support", "Coming soon")}
              />
            </View>
          </View>
        )}

        {/* Danger / Logout */}
        {!loading && (
          <View className="mt-4 bg-white rounded-2xl p-5 shadow">
            <Text className="text-lg font-medium mb-3">Account</Text>
            <TouchableOpacity
              onPress={handleLogout}
              className="w-full h-12 bg-red-500 rounded-xl items-center justify-center"
            >
              <Text className="text-white text-base font-semibold">
                Log Out
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentProfile;
