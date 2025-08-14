// app/ParentWelcomeScreen.tsx

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ParentWelcomeScreen = () => {
  const [code, setCode] = useState("");
  const [copiedText, setCopiedText] = useState("");
  //get parent code from storage
  const getParentCode = async () => {
    const user = await AsyncStorage.getItem("user");
    if (user) {
      const parsedUser = JSON.parse(user);
      console.log("Parsed user data:", parsedUser);
      setCode(parsedUser.parentCode);
    }
  };

  useEffect(() => {
    getParentCode();
  }, []);

  // Split code into individual digits
  const codeDigits = code.split("");

  const handleCopyCode = () => {
    // Handle copy code functionality
    console.log("Copy code:", code);
    copyToClipboard();

    // You can implement clipboard functionality here
  };
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    setCopiedText("Copied!");
    setTimeout(() => setCopiedText(""), 2000); // Clear feedback after
    // Optionally show feedback to user here
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-center items-center p-6 mt-4">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-8xl font-light text-primary mb-2">
              Welcome !
            </Text>
            <Text className="text-3xl text-green-800 font-medium">
              Sign Up Success
            </Text>
          </View>

          {/* Code Section */}
          <View className="w-full items-center mt-10 mb-8">
            <View className="w-[300px] items-center flex-row justify-between">
              <Text className="text-lg font-medium text-gray-700 mb-4">
                Your Parent Code
              </Text>

              {/* Copy icon */}
              <TouchableOpacity
                onPress={handleCopyCode}
                className="absolute right-0 top-0 p-2"
              >
                <Image
                  source={icons.copy}
                  className="w-6 h-6"
                  resizeMode="contain"
                  onError={(error) => console.log("Copy icon error:", error)}
                  onLoad={() => console.log("Copy icon loaded")}
                />
              </TouchableOpacity>
            </View>
            {copiedText && (
              <Text className="text-green-500 text-sm mb-4">{copiedText}</Text>
            )}
            {/* Code Display */}
            <View className="flex-row justify-center space-x-2  mb-4">
              {codeDigits.map((digit, index) => (
                <View
                  key={index}
                  className="w-16 h-16 bg-white rounded-lg border-2 border-gray-200 justify-center items-center shadow-sm"
                >
                  <Text className="text-xl font-bold text-gray-800">
                    {digit}
                  </Text>
                </View>
              ))}
            </View>

            <Text className="text-sm text-gray-600 text-center mt-2 px-4">
              Enter This Code On Your Child&#39;s Device To Connect With You
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/parent_home")}
            className="w-full bg-blue-500 rounded-full py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Continue
            </Text>
          </TouchableOpacity>

          {/* Illustration */}
          <View className="flex-1 justify-end items-center">
            {/* You can replace this with an actual image */}
            <Image
              source={images.bgchilds}
              className="w-auto h-96"
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentWelcomeScreen;
