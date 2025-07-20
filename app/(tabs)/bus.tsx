import React from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";

import Header from "../Components/header"; // Assuming this path is correct

const scrollViewBottomPadding = 24; // Define the padding value

const Bought = () => {
  // Renamed to PascalCase for consistency
  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        {/* Pass the prop if your Header expects it, otherwise remove */}
        <Header isCode={false} />

        <Text className="text-2xl font-light mt-4">The Bus</Text>
        <Text className="text-xl font-light mt-4 ">Madusha School Bus</Text>
        <View className="flex-row justify-between gap-0 mt-4 items-center">
          {/* Added items-center for vertical alignment */}
          <View className="flex-row gap-2 items-center">
            <Text className="font-light text-grayText">Maharagama</Text>
            {/* Removed font-sm as it's not a standard Tailwind size class for font-weight */}
            <View className="w-3 h-3 bg-blue-700 rounded-full" />
          </View>
          {/* CORRECTED HORIZONTAL LINE */}
          <View className="flex-1 h-px bg-blue-700 mx-2" />

          <View className="flex-row gap-2 items-center">
            <View className="w-3 h-3 bg-blue-700 rounded-full" />
            <Text className="font-light text-grayText">
              Royal Institute , Colombo
            </Text>
          </View>
        </View>
        <View className="flex-col mt-12 border-t border-grayText pt-4">
          <Text className="font-light text-grayText">Destination</Text>
          <Text className="font-light text-grayText">Estimated Arrival</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bought;
