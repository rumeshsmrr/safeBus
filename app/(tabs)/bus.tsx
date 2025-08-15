// app/BusList.tsx
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import {
  filterBuses,
  subscribeAllBusProfiles,
  type BusProfile,
} from "@/data/busProfiles";
import Header from "../Components/header";

const scrollViewBottomPadding = 24;

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
  >
    <Text className="text-gray-700 text-xs">{label}</Text>
  </TouchableOpacity>
);

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
    activeOpacity={0.9}
    onPress={onPress}
    className="bg-white rounded-2xl shadow px-4 pt-4 pb-3"
  >
    {/* Top row: icon + title + rating */}
    <View className="flex-row items-start">
      <View className="w-10 h-10 bg-[#E8F0FF] rounded-xl items-center justify-center mr-3">
        <Image
          source={images.bus}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
      </View>

      <View className="flex-1" style={{ minWidth: 0 }}>
        <Text className="text-[17px] font-semibold" numberOfLines={1}>
          {bus.busNickName || "Unnamed Bus"}
        </Text>
        <Text className="text-gray-500 mt-0.5" numberOfLines={1}>
          {bus.busNumber || bus.busId}
        </Text>
      </View>

      <RatingPill avg={bus.ratingAvg ?? 0} count={bus.ratingCount ?? 0} />
    </View>

    {/* Route */}
    <View className="flex-row items-center mt-3">
      <View className="flex-row items-center flex-1" style={{ minWidth: 0 }}>
        <Image source={images.location} style={{ width: 12, height: 12 }} />
        <Text className="text-gray-600 ml-2" numberOfLines={1}>
          {bus.startAddress || "-"}
        </Text>
      </View>
      <View className="h-[2px] w-[40px] bg-gray-200 mx-8" />
      <View className="flex-row items-center flex-1" style={{ minWidth: 0 }}>
        <Image source={images.location} style={{ width: 12, height: 12 }} />
        <Text className="text-gray-600 ml-2" numberOfLines={1}>
          {bus.endAddress || "-"}
        </Text>
      </View>
    </View>

    {/* Footer actions */}
    <View className="flex-row items-center justify-between mt-3">
      <Text className="text-gray-500 flex-1" numberOfLines={1}>
        {bus.contactNumber || ""}
      </Text>
      <View className="flex-row gap-4">
        {!!bus.contactNumber && (
          <TouchableOpacity onPress={onCall}>
            <Text className="text-primary">Call</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onPress}>
          <Text className="text-primary">View</Text>
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

  // quick chips from frequent start/end addresses (top 6)
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
    router.push(`/busDetails?docId=${encodeURIComponent(docId)}`); // ✅ pass Firestore doc id

  const onRefresh = () => {
    // Realtime sub already keeps fresh; just show a quick spinner
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#E7F1FF]">
      <FlatList
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: scrollViewBottomPadding,
        }}
        ListHeaderComponent={
          <>
            <Header isCode={false} />
            {/* Title + search toggle */}
            <View className="flex-row items-center justify-between mt-2 mb-1">
              <Text className="text-2xl font-light">Find a Bus</Text>
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

            {/* Search */}
            {isSearchVisible && (
              <View className="mb-3 relative">
                <TextInput
                  className="bg-white rounded-full px-4 py-3 pr-12 shadow"
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
            )}

            {/* Quick chips */}
            {chips.length > 0 && (
              <View className="flex-row flex-wrap mb-3">
                {chips.map((c) => (
                  <Chip key={c} label={c} onPress={(q) => setSearchQuery(q)} />
                ))}
              </View>
            )}

            {/* Result count */}
            {!loading && isSearchVisible && searchQuery.trim().length > 0 && (
              <Text className="text-gray-600 text-xs mb-2">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} for “
                {searchQuery}”
              </Text>
            )}
          </>
        }
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="mb-4">
            <BusCard
              bus={item}
              onPress={() => openDetails(item.id)}
              onCall={() => {
                if (item.contactNumber)
                  Linking.openURL(`tel:${item.contactNumber}`);
              }}
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
              <Text className="text-gray-600">No buses found.</Text>
              {searchQuery ? (
                <Text className="text-gray-400 text-sm mt-1">
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
