import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "../Components/header"; // Assuming this path is correct

const scrollViewBottomPadding = 24; // Define the padding value

const Bus = () => {
  const driverList = [
    { name: "Madusha Nayajith", rating: "4.7 / 5", isPrimary: true },
    { name: "John Doe", rating: "4.5 / 5", isPrimary: false },
    { name: "Jane Smith", rating: "4.8 / 5", isPrimary: false },
    { name: "Alice Johnson", rating: "4.6 / 5", isPrimary: false },
  ];
  // Button Component
  const Button = ({
    title,
    onPress,
    bgColor,
  }: {
    title: string;
    onPress: () => void;
    bgColor?: string;
  }) => (
    // Key change: Removed 'm-auto' and 'flex' which could conflict with w-[48%]
    // Added 'flex-shrink-0' to prevent shrinking if content gets too large
    <TouchableOpacity
      className="w-[48%] bg-black rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
      style={
        bgColor ? { backgroundColor: bgColor } : { backgroundColor: "#d2d2d2" }
      }
      onPress={onPress}
    >
      {/* Ensure Text is centered if button itself is fixed width */}
      <Text className="text-xl font-normal text-grayText text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );
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

        <Text className="text-2xl font-light mt-4">The Bus</Text>
        <Text className="text-xl font-light mt-4 ">Madusha School Bus</Text>
        <View className="flex-row justify-between gap-0 mt-4 items-center">
          {/* Added items-center for vertical alignment */}
          <View className="flex-row gap-2 items-center">
            <Text className="font-light text-grayText">Maharagama</Text>
            {/* Removed font-sm as it's not a standard Tailwind size class for font-weight */}
            <View className="w-3 h-3 bg-blue-700 rounded-full" />
          </View>
          {/* CORRECTED HORIZONTAL LINE */}
          <View className="flex-1 h-px bg-blue-700 mx-2" />

          <View className="flex-row gap-2 items-center">
            <View className="w-3 h-3 bg-blue-700 rounded-full" />
            <Text className="font-light text-grayText">
              Royal Institute , Colombo
            </Text>
          </View>
        </View>
        <View className="flex-col mt-4 border-t border-grayText pt-4">
          <Text className="text-xl font-light">Driver List</Text>
          <View className="flex-col mt-4">
            <View className="flex-col">
              {driverList.map((driver) => (
                <View
                  key={driver.name}
                  className="flex-row py-2"
                  style={{ alignItems: "center" }}
                >
                  <View className="flex-1">
                    <Text className="text-lg text-grayText font-light">
                      {driver.isPrimary ? "Primary Driver" : "Secondary Driver"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-grayText font-light">
                      {driver.name}
                    </Text>
                  </View>
                  <View className="flex-1 items-end">
                    <Text className="text-lg text-grayText font-light">
                      {driver.rating}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
        <View className="flex-col mt-4 border-t border-b pb-4 border-grayText pt-4">
          <Text className="text-xl font-light">Contact Info</Text>
          <View className="flex-col mt-4">
            <Text className="text-lg text-grayText font-light">
              Madusha Nayajith
            </Text>
            <Text className="text-lg text-grayText font-light">
              077 123 4567
            </Text>
            <Text className="text-lg text-grayText font-light">
              madusha@example.com
            </Text>
            <Text className="text-lg text-grayText font-light">
              no 1, Road Name, city, state
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap justify-between mt-12 w-full">
          {/* loop  */}
          <Button
            title="Notify Driver"
            onPress={() => console.log("Notify Driver Pressed")}
            bgColor="#F8B959"
          />
          <Button
            title="Complaint"
            onPress={() => console.log("Complaint Pressed")}
            bgColor="#F85959"
          />

          <Button
            title="Add Child"
            onPress={() => console.log("Add Child Pressed")}
            bgColor="#A9C9FB"
          />
          <Button
            title="Rate Driver"
            onPress={() => console.log("Rate Driver Pressed")}
            bgColor="#F292F1"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Bus;
