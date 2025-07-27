import React from "react";
import { SafeAreaView, ScrollView, Text } from "react-native";

const scrollViewBottomPadding = 24; // Define the padding value

const driver_home = () => {
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
        <Text className="text-2xl font-light mt-4">Driver Home</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

export default driver_home;
