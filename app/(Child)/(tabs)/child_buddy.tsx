import Header from "@/app/Components/header";
import { images } from "@/constants/images";
import React from "react";
import {
  Image,
  ImageSourcePropType,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native"; // Define the padding value

const scrollViewBottomPadding = 24;

interface BuddyInfo {
  name: string;
  parentName: string;
  image: ImageSourcePropType;
  status: string;
}

const child_buddy = () => {
  const tempChildImage = images.childImage1;
  const buddyInfo: BuddyInfo[] = [
    {
      name: "Buddy Name",
      parentName: "Parent Name",
      image: tempChildImage, // Replace with actual image URL
      status: "Available", // Example status
    },
  ];
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
        <Text className="text-2xl font-light mt-4">Your Buddy</Text>
        <View className="flex-col items-center justify-center mt-4 gap-2">
          {buddyInfo.map((buddy, index) => (
            <View
              key={index}
              className="w-full bg-white rounded-2xl shadow-lg p-6 mb-4 mx-2"
            >
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-1" />
                <View className="bg-orange-400 px-4 py-2 rounded-full">
                  <Text className="text-white font-semibold text-sm">
                    {buddy.status}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={buddy.image}
                    className="w-20 h-20 rounded-full border-4 border-blue-500"
                  />
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-2xl font-bold text-gray-800 mb-1">
                    {buddy.name}
                  </Text>
                  <Text className="text-lg text-gray-500">
                    Parent Name : {buddy.parentName}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default child_buddy;
