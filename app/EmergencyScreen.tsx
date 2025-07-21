import React from "react";
import { SafeAreaView, ScrollView, Text } from "react-native";
import Header2 from "./Components/header2";

const scrollViewBottomPadding = 24;

const EmergencyScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Text className="text-2xl font-light mt-4">My Child</Text>
        <Text className="text-xl font-light mt-4 ">Connected Child</Text>
      </ScrollView>
    </SafeAreaView>
  );
};
export default EmergencyScreen;
