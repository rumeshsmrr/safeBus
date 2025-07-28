import React from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import Header from "../Components/header"; // Assuming this path is correct

const scrollViewBottomPadding = 24; // Define the padding value

interface Child {
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

interface NewRequest {
  name: string;
  isLinked: boolean;
  image: any; // Use the appropriate type for your image
}

const Child = () => {
  const tempImage = images.childImage1;
  const childList = [
    {
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

  const newRequest = {
    name: "Shemina Mansith",
    isLinked: false,
    image: tempImage,
  };

  // const newRequest: NewRequest | null = null; // Set to null if no new request

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

        <Text className="text-2xl font-light mt-4">My Child</Text>
        <Text className="text-xl font-light mt-4 ">Connected Child</Text>
        <View className="flex-col gap-2 pt-4">
          {childList.map((child, index) => (
            <View
              key={index}
              className="flex-col  gap-4 bg-white p-4 rounded-lg shadow"
            >
              <View className="flex-row items-center gap-4">
                <Image
                  source={child.image}
                  className="h-12 w-12 rounded-full"
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
                      className="h-4 w-4"
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
                      className="h-4 w-4"
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
              <View className="flex-row justify-between gap-2 border-t border-gray-200 pt-2">
                <TouchableOpacity
                  className="bg-redsh py-2 px-4 min-w-[80px]  rounded-lg"
                  onPress={() => console.log("Remove Pressed")}
                >
                  <Text className="text-white text-center">Remove</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 py-2 px-4 min-w-[80px] rounded-lg"
                  onPress={() => console.log("Edit Pressed")}
                >
                  <Text className="text-white text-center">Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
        <Text className="text-xl font-light mt-4 ">New Link Request</Text>
        <View className="flex-col gap-4 pt-4">
          {newRequest ? (
            <View className="flex-col gap-4 bg-white p-4 rounded-lg shadow">
              <View className="flex-row items-center gap-4">
                <Image
                  source={newRequest.image}
                  className="h-12 w-12 rounded-full"
                />
                <View className="flex-1">
                  <Text className="text-lg font-semibold">
                    {newRequest.name}
                  </Text>
                  <Text className="text-sm text-blue-700 font-light">
                    {newRequest.isLinked
                      ? "Linked to Bus"
                      : "Not Linked to Bus"}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between gap-2 border-t border-gray-200 pt-2">
                <TouchableOpacity
                  className="bg-redsh py-2 px-4 min-w-[80px] rounded-lg"
                  onPress={() => console.log("Reject Pressed")}
                >
                  <Text className="text-white text-center">Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-greensh py-2 px-4 min-w-[80px] rounded-lg"
                  onPress={() => console.log("Confirm Pressed")}
                >
                  <Text className="text-white text-center">Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-4 bg-white p-4 rounded-lg shadow">
              <Text className="text-lg font-semibold text-gray-500">
                No new link requests
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Child;
