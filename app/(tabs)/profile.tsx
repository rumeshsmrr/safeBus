import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const handleLogout = () => {
  // Add logout logic here
  //remove user data from storage, clear session, etc.
  AsyncStorage.removeItem("userData")
    .then(() => {
      console.log("User data removed");
      //Navigate to login or home screen after logout
      router.replace("/LogingScreen");
    })
    .catch((error) => {
      console.error("Error removing user data:", error);
    });
};

const search = () => {
  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 24, // Replace with a valid value
        }}
      >
        <Text>search</Text>
        {/* ///log out button */}
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Text style={{ fontSize: 18, fontWeight: "600" }}>Log Out</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="w-[200px] h-[50px] bg-blue-500 rounded-lg items-center justify-center mt-4"
          >
            <Text style={{ color: "#007bff" }}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default search;
