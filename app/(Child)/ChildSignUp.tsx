// app/LoginScreen.tsx

import React from "react";
import { ScrollView, View } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

const ParentSignUp = () => {
  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="flex-1 justify-center items-center mt-4"></View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentSignUp;
