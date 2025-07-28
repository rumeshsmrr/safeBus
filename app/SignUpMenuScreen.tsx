import { images } from "@/constants/images";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const SignUpMenuScreen = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    console.log("Selected role:", role);
    // Navigate to next screen or handle role selection
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <View className="flex-1 px-6 pt-10 mt-4">
        {/* Header */}
        <View className="items-center mb-16">
          <Text className="text-3xl font-semibold text-gray-800 mb-2">
            Sign Up
          </Text>
          <Text className="text-lg text-gray-600 font-normal">
            Select Your Role
          </Text>
        </View>

        {/* Role Selection Cards */}
        <View className="flex-row justify-between mb-10 gap-4">
          {/* Parent Role */}
          <TouchableOpacity
            className={`flex-1 bg-white rounded-2xl p-4 items-center shadow-lg border-2 min-h-[200px] ${
              selectedRole === "parent"
                ? "border-blue-500 bg-blue-50"
                : "border-transparent"
            }`}
            onPress={() => handleRoleSelect("parent")}
            activeOpacity={0.8}
          >
            <View className="flex-1 justify-center items-center mb-3">
              <Image
                source={images.parentImG}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
                onError={(error) => console.log("Parent image error:", error)}
                onLoad={() => console.log("Parent image loaded")}
              />
            </View>
            <Text className="text-base font-medium text-gray-800 text-center">
              I am a Parent
            </Text>
          </TouchableOpacity>

          {/* Child Role */}
          <TouchableOpacity
            className={`flex-1 bg-white rounded-2xl p-4 items-center shadow-lg border-2 min-h-[200px] ${
              selectedRole === "child"
                ? "border-blue-500 bg-blue-50"
                : "border-transparent"
            }`}
            onPress={() => handleRoleSelect("child")}
            activeOpacity={0.8}
          >
            <View className="flex-1 justify-center items-center mb-3">
              <Image
                source={images.boyGirl}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
                onError={(error) => console.log("Child image error:", error)}
                onLoad={() => console.log("Child image loaded")}
              />
            </View>
            <Text className="text-base font-medium text-gray-800 text-center">
              I am a Child
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Illustration */}
        <View className="flex-1 justify-end items-center pb-24 ">
          <View className="w-full h-auto">
            <Image
              source={images.bgchilds}
              className="w-full h-full"
              resizeMode="contain"
              onError={(error) => console.log("Bottom image error:", error)}
              onLoad={() => console.log("Bottom image loaded")}
            />
          </View>
        </View>

        {/* Continue Button */}
        {selectedRole && (
          <View className="absolute bottom-10 left-6 right-6">
            <TouchableOpacity
              className="bg-blue-500 py-4 rounded-xl items-center shadow-md"
              //   onPress={() => console.log("Continue with role:", selectedRole)}
              onPress={() => {
                // Navigate to the next screen based on selected role
                if (selectedRole === "parent") {
                  // Navigate to Parent Sign Up
                  console.log("Navigating to Parent Sign Up");
                  router.push("/ParentSignUp");
                } else if (selectedRole === "child") {
                  // Navigate to Child Sign Up
                  console.log("Navigating to Child Sign Up");
                  router.push("/(Child)/ChildSignUp");
                }
              }}
              activeOpacity={0.8}
            >
              <Text className="text-white text-lg font-semibold">Continue</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default SignUpMenuScreen;
