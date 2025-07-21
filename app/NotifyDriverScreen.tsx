import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header2 from "./Components/header2";

const scrollViewBottomPadding = 24; // Define the padding value

interface Child {
  id: string;
  name: string;
  isLinked: boolean;
  image: any; // Use the appropriate type for your image
  homeLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
  schoolLocation: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

const tempImage = images.childImage1; // Replace with actual image path
const selectedChild: Child[] = [
  {
    id: "1",
    name: "Shenuki Dilsara",
    isLinked: true,
    image: tempImage,
    homeLocation: {
      latitude: 6.8856,
      longitude: 79.8596,
      address: "Wattegedara, Maharagama, Sri Lanka",
    },
    schoolLocation: {
      latitude: 6.9271,
      longitude: 79.8612,
      address: "Maradana, Sri Lanka",
    },
  },
];
const NotifyDriverScreen = () => {
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
        <Header2 />
        <Text className="text-2xl font-light mt-4">My Child</Text>
        <Text className="text-xl font-light mt-4 ">Connected Child</Text>
        <View className="flex-col gap-2 pt-4">
          {selectedChild.map((child: Child, index: number) => (
            <TouchableOpacity
              key={index}
              className="flex-col  gap-4 bg-white p-4 rounded-lg shadow"
            >
              <View className="flex-row items-center gap-4">
                <Image
                  source={child.image}
                  style={{ height: 48, width: 48, borderRadius: 24 }}
                />
                <View className="flex-1">
                  <Text className="text-lg font-semibold">{child.name}</Text>
                  <Text className="text-sm text-blue-700 font-light">
                    {child.isLinked ? "Linked to Bus" : "Not Linked to Bus"}
                  </Text>
                </View>
              </View>
              <View className="flex-col gap-2 border-t border-gray-200 pt-2">
                <Text className="text-md text-grayText">Home:</Text>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row gap-2">
                    <Image
                      source={icons.homeLocationIcon}
                      style={{ height: 16, width: 16 }}
                    />
                    <Text className="text-sm text-grayText">
                      {child.homeLocation.address}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 ">
                    <Text className="text-grayText">{`${child.homeLocation.latitude}"N`}</Text>
                    <Text className="text-grayText">{`${child.homeLocation.longitude}"E`}</Text>
                  </View>
                </View>
                <Text className="text-md text-grayText">School:</Text>
                <View className="flex-row items-center justify-between gap-2">
                  <View className="flex-row gap-2">
                    <Image
                      source={icons.schoolLocationIcon}
                      style={{ height: 16, width: 16 }}
                    />
                    <Text className="text-sm text-grayText">
                      {child.schoolLocation.address}
                    </Text>
                  </View>

                  <View className="flex-row gap-2 ">
                    <Text className="text-grayText">{`${child.schoolLocation.latitude}"N`}</Text>
                    <Text className="text-grayText">{`${child.schoolLocation.longitude}"E`}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {/* form. input with date, predifined messages  */}
        <View className="mt-6"></View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default NotifyDriverScreen;
