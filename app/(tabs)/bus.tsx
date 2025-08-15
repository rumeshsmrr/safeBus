import { images } from "@/constants/images";
import {
  BusProfile,
  filterBuses,
  subscribeAllBusProfiles,
} from "@/data/busProfiles";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Header from "../Components/header";

const scrollViewBottomPadding = 100;

const Bus = () => {
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [buses, setBuses] = useState<(BusProfile & { id: string })[] | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeAllBusProfiles(
      (list) => {
        setBuses(list);
        console.log("bus list:", list); // log the fresh list (not stale state)
        setLoading(false);
      },
      (err) => {
        console.error("Error subscribing bus profiles:", err);
        setBuses([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleSearchToggle = () => {
    setIsSearchVisible((v) => !v);
    if (isSearchVisible) setSearchQuery("");
  };

  const clearSearch = () => setSearchQuery("");

  // Use the helper that already matches your schema fields
  const filteredBuses = useMemo(() => {
    if (!buses) return [];
    return filterBuses(buses, searchQuery);
  }, [buses, searchQuery]);

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

        {/* Header with Search */}
        <View className="flex-row p-2 justify-between">
          <Text className="text-2xl font-light mb-2 mt-6">Find a Bus</Text>
          <TouchableOpacity
            onPress={handleSearchToggle}
            className="w-12 h-12 justify-center items-center mt-4 mb-4 p-4 bg-white rounded-full shadow"
          >
            <Image
              source={images.searchImg}
              style={{ width: 24, height: 24 }}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        {isSearchVisible && (
          <View className="mb-4 relative">
            <TextInput
              className="bg-white rounded-full px-4 py-3 pr-12 shadow"
              placeholder="Search by bus name, number, or location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus={true}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={clearSearch}
                className="absolute right-4 top-3"
              >
                <Text className="text-gray-500 text-lg">✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Loading / Error / Empty states */}
        {loading && (
          <View className="items-center justify-center py-12">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading buses…</Text>
          </View>
        )}

        {!loading && buses && buses.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className="text-gray-500">No buses available right now.</Text>
          </View>
        )}

        {/* Search Results Info */}
        {!loading && searchQuery.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-600 text-sm">
              {filteredBuses.length} result
              {filteredBuses.length !== 1 ? "s" : ""} found for &quot;
              {searchQuery}&quot;
            </Text>
          </View>
        )}

        {/* No Results Message */}
        {!loading && searchQuery.length > 0 && filteredBuses.length === 0 && (
          <View className="justify-center items-center py-12">
            <Text className="text-gray-500 text-lg text-center">
              No buses found matching &quot;{searchQuery}&quot;
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Try searching with different keywords
            </Text>
          </View>
        )}

        {/* Bus List */}
        {!loading && filteredBuses.length > 0 && (
          <View className="gap-4">
            {filteredBuses.map((bus, index) => (
              <View
                key={`${bus.id}-${index}`}
                className="bg-white rounded-xl shadow h-fit"
              >
                {/* Header */}
                <View className="p-4 flex-row items-start justify-start gap-2 h-[45px]">
                  <Image
                    source={images.bus}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                  <View className="flex-1 justify-center">
                    <View className="flex-row gap-2 items-center">
                      <Text
                        className="text-xl font-medium flex-shrink"
                        numberOfLines={1}
                      >
                        {bus.busNickName || "Unnamed Bus"}
                      </Text>
                      <Text className="text-xl font-extralight text-gray-500">
                        |{" "}
                        {
                          bus.busNumber ||
                            bus.busId /* show number if set, fallback to id */
                        }
                      </Text>
                    </View>
                  </View>

                  {/* Rating aggregate */}
                  <View className="items-end">
                    <Text className="text-xl font-bold text-secondary">
                      {(bus.ratingAvg ?? 0).toFixed(1)} / 5
                    </Text>
                    <Text className="text-[12px] text-gray-500">
                      ({bus.ratingCount ?? 0} review
                      {(bus.ratingCount ?? 0) === 1 ? "" : "s"})
                    </Text>
                  </View>
                </View>

                {/* Locations */}
                <View className="flex-row px-4 justify-between items-center h-[30px]">
                  <View className="flex-row gap-2 items-center">
                    <Image
                      source={images.location}
                      style={{ width: 12, height: 12 }}
                      resizeMode="contain"
                    />
                    <Text className="text-lg text-gray-500" numberOfLines={1}>
                      {bus.startAddress || "-"}
                    </Text>
                  </View>
                  <View className="h-[2px] w-[50px] bg-grayText/50" />
                  <View className="flex-row gap-2 items-center">
                    <Image
                      source={images.location}
                      style={{ width: 12, height: 12 }}
                      resizeMode="contain"
                    />
                    <Text className="text-lg text-gray-500" numberOfLines={1}>
                      {bus.endAddress || "-"}
                    </Text>
                  </View>
                </View>

                {/* Footer */}
                <View className="border-t border-gray-200 px-4 py-3 h-[40px] justify-between flex-row">
                  <Text className="text-base text-grayText" numberOfLines={1}>
                    {bus.contactNumber || ""}
                  </Text>
                  <View className="flex-row gap-10">
                    {bus.contactNumber ? (
                      <TouchableOpacity className="flex-row items-center gap-1">
                        <Text
                          className="text-base text-primary"
                          numberOfLines={1}
                        >
                          Contact
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      className="flex-row items-center gap-1"
                      onPress={() =>
                        router.push(
                          `/busDetails?busId=${encodeURIComponent(bus.busId || bus.id)}`
                        )
                      }
                    >
                      <Text
                        className="text-base text-primary"
                        numberOfLines={1}
                      >
                        View
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bus;
