import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard"; // Import Clipboard
import React, { useEffect, useState } from "react"; // Import useState
import { Image, Text, TouchableOpacity, View } from "react-native";

interface HeaderProps {
  isCode?: boolean; // Optional prop to determine if parent code should be displayed
}

// Convert to a Functional Component
const Header = ({ isCode }: HeaderProps) => {
  // Renamed from 'header' to 'Header' (PascalCase for components)
  // const parentCode = "123456";
  const [copiedText, setCopiedText] = useState("");
  const [parentCode, setParentCode] = useState(""); // Default parent code
  interface User {
    name?: string;
    firstName?: string;
    parentCode?: string;
    // Add other properties as needed
  }

  const [user, setUser] = useState<User>({});

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(parentCode);
    setCopiedText("Copied!");
    setTimeout(() => setCopiedText(""), 2000);
  };

  const currentDate = new Date(); // Get current date once

  useEffect(() => {
    const fetchData = async () => {
      const user = await AsyncStorage.getItem("user");
      console.log("Fetched user data:", user);
      if (user) {
        const parsedUser = JSON.parse(user);
        console.log(parsedUser);
        setUser(parsedUser);
        if (parsedUser.parentCode) {
          setParentCode(parsedUser.parentCode);
        }
      }
    };
    fetchData();
  }, []);

  return (
    <View className="p-2 pt-4 pb-0">
      <View className="flex-row items-center">
        <Image source={images.parentImage} className="h-12 w-12 rounded-full" />
        <View className="flex-1 items-center justify-center text-center">
          <Text className="text-2xl font-semibold">Hello {user.name} !</Text>
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
      {isCode && (
        <View className="flex-row items-center justify-start gap-4 mt-4">
          <Text className="text-xl font-semibold text-gray-600">
            Parent Code :
          </Text>
          <Text className="text-xl font-semibold text-gray-800">
            {parentCode}
          </Text>
          <TouchableOpacity onPress={copyToClipboard}>
            <Image
              source={icons.copy}
              className="h-6 w-6"
              resizeMode="contain"
            />
          </TouchableOpacity>
          {copiedText ? (
            <Text className="text-green-500 text-sm ml-2">{copiedText}</Text>
          ) : null}
        </View>
      )}
    </View>
  );
};

export default Header; // Export the functional component
