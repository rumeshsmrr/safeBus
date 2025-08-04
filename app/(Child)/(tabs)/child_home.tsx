import Header from "@/app/Components/header";
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

const scrollViewBottomPadding = 24; // Define the padding value
const driver = {
  id: 1,
  name: "Madusha",
};
const childs = [
  {
    id: "1",
    name: "Shenuki Dilsara",
    image: images.childImage1,
    status: "Dropped",
    Notification: [
      {
        id: "1",
        message: "Dropped at School",
        time: "10:30 AM",
      },
      {
        id: "2",
        message: "On Bus",
        time: "9:00 AM",
      },
    ],
    // Hardcoded location for Shenuki (near Colombo based on given coordinates)
    location: {
      latitude: 6.8856,
      longitude: 79.8596,
    },
  },
];

const child_home = () => {
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
        <Header isCode={false} />
        <Text className="text-xl font-light mt-4"> Parent Name : John Doe</Text>
        {childs.map((item) => (
          <View
            key={item.id}
            className="w-full h-fit bg-white mt-4 rounded-xl shadow-md"
          >
            <View className="flex-row items-start p-4">
              <Image source={item.image} className="h-12 w-12 rounded-full" />
              <View className="flex-row ml-4 flex-1 justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-darkbg capitalize">
                    {item.name}
                  </Text>
                  <Text className="text-grayText text-base">
                    Madusha School Bus Service
                  </Text>
                  <Text className="text-grayText text-base">
                    Driver Name: {driver.name}
                  </Text>
                </View>
                <Text
                  className={`text-gray-600 px-4 py-2 ${item.status === "On Bus" ? "bg-yellow-300" : item.status === "Dropped" ? "bg-green-300" : item.status === "AB" ? "bg-red-300" : ""} rounded-full`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View className="border-t border-gray-200 p-4">
              <Text className="text-lg font-semibold mb-2">
                Recent Notifications
              </Text>
              {item.Notification.map((notification) => (
                <View
                  key={notification.id}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text className="text-grayText text-base">
                    {notification.message}
                  </Text>
                  <Text className="text-grayText text-sm">
                    {notification.time}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View className="mt-6 w-full items-center">
          <TouchableOpacity
            className="w-full h-[300px] rounded-xl bg-redsh gap-2 text-darkbg flex-1 justify-center items-center"
            onLongPress={() => console.log("Emergency Button Pressed")}
            activeOpacity={0.7}
          >
            <Text className="text-5xl font-light h-12">Emergency</Text>
            <Text className="text-lg font-light">Press and Hold</Text>
          </TouchableOpacity>
        </View>
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <TouchableOpacity
            className="w-[48%] bg-yellowsh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => {
              console.log("Notify Driver Pressed");
            }}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-[48%] bg-greensh rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
            onPress={() => {
              console.log("Notify Parent Pressed");
            }}
          >
            <Text className="text-xl font-normal text-grayText text-center">
              Notify Parent
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default child_home;
