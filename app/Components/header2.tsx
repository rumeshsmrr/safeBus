import { icons } from "@/constants/icons";
import React from "react"; // Import useState
import { Image, Text, View } from "react-native";

// Convert to a Functional Component
const Header2 = () => {
  const currentDate = new Date(); // Get current date once

  return (
    <View className=" pt-4 pb-0">
      <View className="flex-row items-center">
        <Image source={icons.back} className="h-6 w-6 rounded-full" />
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
