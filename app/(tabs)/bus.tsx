// app/BusList.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { images } from "@/constants/images";
import {
  filterBuses,
  subscribeAllBusProfiles,
  type BusProfile,
} from "@/data/busProfiles";
import Header from "../Components/header";

const PADDING_BOTTOM = 24;

const RatingPill = ({
  avg = 0,
  count = 0,
}: {
  avg?: number;
  count?: number;
}) => (
  <View className="bg-[#F5F7FF] px-2.5 py-1 rounded-full items-center">
    <Text className="text-[12px] text-gray-800">
      ★ {avg.toFixed(1)} <Text className="text-gray-500">({count})</Text>
    </Text>
  </View>
);

const Chip = ({
  label,
  onPress,
}: {
  label: string;
  onPress: (q: string) => void;
}) => (
  <TouchableOpacity
    className="px-3 py-1.5 rounded-full bg-white border border-gray-200 mr-2 mb-2"
    onPress={() => onPress(label)}
    activeOpacity={0.9}
  >
    <Text className="text-gray-700 text-xs">{label}</Text>
  </TouchableOpacity>
);

const DividerDot = () => (
  <View className="flex-row items-center mx-2">
    <MaterialCommunityIcons name="dots-horizontal" size={18} color="#9ca3af" />
  </View>
);

const BusCard = ({
  bus,
  onPress,
  onCall,
}: {
  bus: BusProfile & { id: string };
  onPress: () => void;
  onCall?: () => void;
}) => (
  <TouchableOpacity
    activeOpacity={0.92}
    onPress={onPress}
    className="bg-white rounded-2xl shadow px-4 pt-4 pb-3"
  >
    {/* Top row: icon + title + rating */}
    <View className="flex-row items-start">
      <LinearGradient
        colors={["#DCEBFF", "#B8D6FF"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
      >
        <Image
          source={images.bus}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
      </LinearGradient>

      <View className="flex-1" style={{ minWidth: 0 }}>
        <Text className="text-[17px] font-semibold" numberOfLines={1}>
          {bus.busNickName || "Unnamed Bus"}
        </Text>
        <View className="flex-row items-center gap-1 mt-0.5">
          <Ionicons name="card-outline" size={12} color="#6b7280" />
          <Text className="text-gray-500" numberOfLines={1}>
            {bus.busNumber || bus.busId}
          </Text>
        </View>
      </View>

      <RatingPill avg={bus.ratingAvg ?? 0} count={bus.ratingCount ?? 0} />
    </View>

    {/* Route */}
    <View className="flex-row items-center mt-3">
      <View className="flex-row items-center flex-1" style={{ minWidth: 0 }}>
        <Ionicons name="location-outline" size={14} color="#374151" />
        <Text className="text-gray-700 ml-1.5 flex-1" numberOfLines={1}>
          {bus.startAddress || "-"}
        </Text>
      </View>

      <DividerDot />

      <View className="flex-row items-center flex-1" style={{ minWidth: 0 }}>
        <Ionicons name="flag-outline" size={14} color="#374151" />
        <Text className="text-gray-700 ml-1.5 flex-1" numberOfLines={1}>
          {bus.endAddress || "-"}
        </Text>
      </View>
    </View>

    {/* Footer actions */}
    <View className="flex-row items-center justify-between mt-3">
      <Text className="text-gray-500 flex-1" numberOfLines={1}>
        {bus.contactNumber || ""}
      </Text>
      <View className="flex-row gap-5">
        {!!bus.contactNumber && (
          <TouchableOpacity
            onPress={onCall}
            className="flex-row items-center gap-1"
            hitSlop={8}
          >
            <Ionicons name="call-outline" size={16} color="#0E59FF" />
            <Text className="text-primary">Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onPress}
          className="flex-row items-center gap-1"
          hitSlop={8}
        >
          <Text className="text-primary">View</Text>
          <Ionicons name="chevron-forward" size={16} color="#0E59FF" />
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const BusList = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [buses, setBuses] = useState<(BusProfile & { id: string })[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeAllBusProfiles(
      (list) => {
        setBuses(list);
        setLoading(false);
      },
      () => {
        setBuses([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (!buses) return [];
    return filterBuses(buses, searchQuery);
  }, [buses, searchQuery]);

  // Quick chips: frequent start/end addresses (top 6)
  const chips = useMemo(() => {
    const all = new Map<string, number>();
    (buses ?? []).forEach((b) => {
      if (b.startAddress)
        all.set(b.startAddress, (all.get(b.startAddress) ?? 0) + 1);
      if (b.endAddress) all.set(b.endAddress, (all.get(b.endAddress) ?? 0) + 1);
    });
    return [...all.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label]) => label);
  }, [buses]);

  const openDetails = (docId: string) =>
    router.push(`/busDetails?docId=${encodeURIComponent(docId)}`);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 550);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      {/* Hero */}
      <LinearGradient
        colors={["#D9E8FF", "#9fc3f5"]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        className="px-4 pt-2 pb-5"
        style={{ borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}
      >
        <Header isCode={false} />

        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-2xl font-light text-[#0b1736]">Find a Bus</Text>
          <TouchableOpacity
            onPress={() => setIsSearchVisible((v) => !v)}
            className="w-11 h-11 rounded-full bg-white items-center justify-center shadow"
          >
            <Image
              source={images.searchImg}
              style={{ width: 22, height: 22 }}
            />
          </TouchableOpacity>
        </View>

        {isSearchVisible && (
          <View className="mt-3">
            <View className="bg-white rounded-full px-4 py-3 shadow relative">
              <TextInput
                placeholder="Search by bus name, number, or location…"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery("")}
                  className="absolute right-4 top-3"
                >
                  <Text className="text-gray-500 text-lg">✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Chips */}
            {chips.length > 0 && (
              <View className="flex-row flex-wrap mt-2">
                {chips.map((c) => (
                  <Chip key={c} label={c} onPress={(q) => setSearchQuery(q)} />
                ))}
              </View>
            )}

            {/* Result count */}
            {!loading && searchQuery.trim().length > 0 && (
              <Text className="text-gray-700 text-xs mt-2">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} for “
                {searchQuery}”
              </Text>
            )}
          </View>
        )}
      </LinearGradient>

      {/* List */}
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: PADDING_BOTTOM,
        }}
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4">
            <BusCard
              bus={item}
              onPress={() => openDetails(item.id)}
              onCall={() =>
                item.contactNumber &&
                Linking.openURL(`tel:${item.contactNumber}`)
              }
            />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <View className="items-center justify-center py-16">
              <ActivityIndicator />
              <Text className="text-gray-500 mt-2">Loading buses…</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-16">
              <Text className="text-gray-700 text-base">No buses found</Text>
              {searchQuery ? (
                <Text className="text-gray-500 text-sm mt-1">
                  Try different keywords or clear your search.
                </Text>
              ) : null}
            </View>
          )
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#666"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default BusList;
