import { icons } from "@/constants/icons";
import { useNavigation } from "expo-router";
import React from "react"; // Import useState
import { Image, Text, TouchableOpacity, View } from "react-native";

// Convert to a Functional Component
const Header2 = () => {
  const navigation = useNavigation(); // Get navigation object
  const currentDate = new Date(); // Get current date once

  return (
    <View className="p-6 pt-4 pb-0">
      <View className="flex-row items-center">
        {/* back navigation  */}
        <TouchableOpacity
          onPress={() => {
            // Handle back navigation here, e.g., using a navigation prop or router
            // For example, if using React Navigation:
            navigation.goBack();
          }}
          className="mr-4"
        >
          <Image source={icons.back} className="h-6 w-6 rounded-full" />
        </TouchableOpacity>
        <View className="flex-1 items-center justify-center text-center">
          <Text className="text-lg text-gray-600 mt-1 text-center">
            Today {currentDate.getDate()}{" "}
            {currentDate.toLocaleDateString("default", { month: "short" })}
          </Text>
        </View>
        <View className="h-12 w-12 rounded-full bg-white p-2 justify-center items-center">
          <Image
            source={icons.notification}
            className="h-full w-full rounded-full"
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
};

export default Header2; // Export the functional component
