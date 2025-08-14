import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import Header from "../Components/header"; // Assuming this path is correct

import { router } from "expo-router";

const scrollViewBottomPadding = 100; // Define the padding value

interface BusInterface {
  firstName: string;
  lastName: string;
  email: string;
  nickname: string;
  busID: string;
  rating: number;
  startLocation: string;
  endLocation: string;
  contactNumber: string;
}

const Bus = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const busDetails: BusInterface[] = [
    {
      firstName: "John",
      lastName: "Doe",
      email: "j@gmail.com",
      nickname: "Madusha School bus",
      busID: "BUS1212",
      rating: 4.5,
      startLocation: "Colombo",
      endLocation: "Gampaha",
      contactNumber: "0771234567",
    },
    {
      firstName: "Samitha",
      lastName: "Perera",
      email: "samitha@gmail.com",
      nickname: "Samitha School bus",
      busID: "BUS1213",
      rating: 4.8,
      startLocation: "Kandy",
      endLocation: "Colombo",
      contactNumber: "0777654321",
    },
    {
      firstName: "Nadeesha",
      lastName: "Fernando",
      email: "nadeesha@gmail.com",
      nickname: "Nadeesha School bus",
      busID: "BUS1214",
      rating: 4.7,
      startLocation: "Galle",
      endLocation: "Colombo",
      contactNumber: "0779876543",
    },
    {
      firstName: "Tharindu",
      lastName: "Rajapaksha",
      email: "tharindu@gmail.com",
      nickname: "Tharindu School bus",
      busID: "BUS1215",
      rating: 4.6,
      startLocation: "Negombo",
      endLocation: "Colombo",
      contactNumber: "0776543210",
    },
    {
      firstName: "Dilani",
      lastName: "Wijesinghe",
      email: "d@gmail.com",
      nickname: "Tharindu School bus",
      busID: "BUS1215",
      rating: 4.6,
      startLocation: "Negombo",
      endLocation: "Colombo",
      contactNumber: "0776543210",
    },
  ];

  // Fixed code: Use a conditional check to ensure busDetails is an array.
  // The '|| []' ensures that if busDetails is undefined, it defaults to an empty array.
  const filteredBuses = (busDetails || []).filter((bus) => {
    const query = searchQuery.toLowerCase();
    return (
      bus.nickname.toLowerCase().includes(query) ||
      bus.busID.toLowerCase().includes(query) ||
      bus.startLocation.toLowerCase().includes(query) ||
      bus.endLocation.toLowerCase().includes(query) ||
      bus.firstName.toLowerCase().includes(query) ||
      bus.lastName.toLowerCase().includes(query)
    );
  });

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery(""); // Clear search when hiding
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

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
              placeholder="Search by bus name, ID, or location..."
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

        {/* Search Results Info */}
        {searchQuery.length > 0 && (
          <View className="mb-4">
            <Text className="text-gray-600 text-sm">
              {filteredBuses.length} result
              {filteredBuses.length !== 1 ? "s" : ""} found for &quot;
              {searchQuery}&quot;
            </Text>
          </View>
        )}

        {/* No Results Message */}
        {searchQuery.length > 0 && filteredBuses.length === 0 && (
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
        <View className="gap-4">
          {filteredBuses.map((bus, index) => (
            <View key={index} className="bg-white rounded-xl shadow  h-fit">
              {/* Header Section - Fixed Height */}
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
                      {bus.nickname}
                    </Text>
                    <Text className="text-xl font-extralight text-gray-500">
                      | {bus.busID}
                    </Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-secondary">
                  {bus.rating} / 5
                </Text>
              </View>

              {/* Location Section - Fixed Height */}
              <View className="flex-row px-4 justify-between items-center h-[30px]">
                <View className="flex-row gap-2 items-center">
                  <Image
                    source={images.location}
                    style={{ width: 12, height: 12 }}
                    resizeMode="contain"
                  />
                  <Text className="text-lg text-gray-500" numberOfLines={1}>
                    {bus.startLocation}
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
                    {bus.endLocation}
                  </Text>
                </View>
              </View>

              {/* Footer Section - Fixed Height */}
              <View className="border-t border-gray-200 px-4 py-3 h-[40px] justify-between flex-row ">
                <Text className="text-base text-grayText" numberOfLines={1}>
                  {bus.contactNumber ? bus.contactNumber : ""}
                </Text>
                <View className="flex-row gap-10">
                  <TouchableOpacity className="flex-row items-center gap-1">
                    <Text className="text-base text-primary" numberOfLines={1}>
                      {bus.contactNumber ? "Contact " : ""}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-row items-center gap-1"
                    onPress={() =>
                      router.push(
                        `/busDetails?busId=${encodeURIComponent(bus.busID)}`
                      )
                    }
                  >
                    <Text className="text-base text-primary" numberOfLines={1}>
                      View
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bus;
