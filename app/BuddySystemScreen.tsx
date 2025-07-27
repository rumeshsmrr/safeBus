import React, { useState } from "react";
import {
  Image,
  ImageSourcePropType,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images"; // Assuming this path is correct
import Header2 from "./Components/header2"; // Assuming this path is correct

const scrollViewBottomPadding = 24;

interface Buddy {
  // Renamed interface to Buddy (PascalCase is convention)
  name: string;
  image: ImageSourcePropType;
  phoneNumber: string;
  parentName: string;
  parentPhoneNumber: string;
  yourChildName: string;
  isActive: boolean; // This property will be managed per buddy
}

interface NewBuddyRequest {
  // This interface is not used in the current code, but can be defined if needed
  name: string;
  image: ImageSourcePropType;
  phoneNumber: string;
  parentName: string;
  parentPhoneNumber: string;
  yourChildName: string;
}

interface child {
  childname: string;
  childimage: ImageSourcePropType;
  childId: string;
}

const tempImage = images.childImage1; // Renamed to tempImage (camelCase convention)

const BuddySystemScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBuddy, setSelectedBuddy] = useState<Buddy | null>(null); // Use state for selected buddy
  const [selectedChild, setSelectedChild] = useState<child | null>(null); // State for selected child

  const handleOpenModal = (buddy: Buddy) => {
    // This function will be used to open the modal with the selected buddy
    setIsModalVisible(true);
    setSelectedBuddy(buddy);
    // You can set the selected buddy here if needed
  };

  const handleCloseModal = () => {
    // This function will be used to close the modal
    setIsModalVisible(false);
    setSelectedBuddy(null); // Clear selected buddy when closing
  };

  const [buddies, setBuddies] = useState<Buddy[]>([
    {
      name: "Delisha Samoshi",
      image: tempImage,
      phoneNumber: "123-456-7890",
      parentName: "Shenuki",
      parentPhoneNumber: "098-765-4321",
      yourChildName: "Alice Doe",
      isActive: true, // Initial state for this buddy
    },
    // Add more buddies here if needed, each with their own isActive property
    // {
    //   name: "Another Buddy",
    //   image: tempImage,
    //   phoneNumber: "111-222-3333",
    //   parentName: "Another Parent",
    //   parentPhoneNumber: "444-555-6666",
    //   yourChildName: "Bob Doe",
    //   isActive: false,
    // },
  ]);

  const newBuddyRequests: NewBuddyRequest[] = [
    {
      name: "Delisha Samiksha",
      image: tempImage,
      phoneNumber: "123-456-7890",
      parentName: "Shenuki",
      parentPhoneNumber: "098-765-4321",
      yourChildName: "Alice Doe",
    },
    // Add more requests here if needed
  ];

  const newBuddies = [
    {
      name: "Delisha Samoshi",
      image: tempImage,
      phoneNumber: "123-456-7890",
      parentName: "Shenuki",
      parentPhoneNumber: "098-765-4321",
      yourChildName: "Alice Doe",
      isActive: true, // Initial state for this buddy
    },
    {
      name: "Another Buddy",
      image: tempImage,
      phoneNumber: "111-222-3333",
      parentName: "Another Parent",
      parentPhoneNumber: "444-555-6666",
      yourChildName: "Bob Doe",
      isActive: false, // Initial state for this buddy
    },
  ];

  const yourChild: child[] = [
    {
      childname: "Alice Doe",
      childimage: tempImage,
      childId: "child1", // Example ID, can be any unique identifier
    },
  ];

  // This function now takes the ID (or index) of the buddy to toggle
  const toggleBuddySwitch = (indexToToggle: number) => {
    // Create a new array with the updated buddy
    const updatedBuddies = buddies.map((buddy, index) => {
      if (index === indexToToggle) {
        return { ...buddy, isActive: !buddy.isActive }; // Toggle isActive for the specific buddy
      }
      return buddy; // Return other buddies unchanged
    });
    setBuddies(updatedBuddies); // Update the state with the new array
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Text className="text-2xl font-light mt-4">Buddy System</Text>

        <Text className="text-xl font-light mt-4">Your Child&apos;s Buddy</Text>

        {/* Removed redundant TouchableOpacity wrapping the entire buddy list map.
            Each buddy item itself should be a TouchableOpacity if it opens a modal on tap. */}

        {buddies.map((buddy: Buddy, index: number) => (
          <TouchableOpacity // Make each buddy item itself tappable
            key={index}
            // This will open the modal, but it's a generic modal for now
            className="flex-col items-center mt-4 bg-white p-4 rounded-lg shadow-sm w-full"
          >
            <View className="flex-1 w-full items-start gap-2 mt-2 flex-row">
              <Image source={buddy.image} className="w-12 h-12 rounded-full" />

              <View className="ml-4 flex-1 items-start justify-start flex-col">
                {/* This inner ml-4 flex-1 flex-col seems redundant and adds extra spacing */}
                {/* <View className="ml-4 flex-1 flex-col"> */}
                <View className="flex-row items-center w-full justify-between">
                  <Text className="text-lg font-semibold mb-[-4px]">
                    {/* Added negative margin to reduce gap */}
                    {buddy.name}
                  </Text>

                  <View className="flex-row gap-2 items-center">
                    <Text className="text-sm text-gray-500">
                      {buddy.isActive ? "Active" : "Inactive"}
                    </Text>
                    <TouchableOpacity
                      className={`flex-row items-center w-[50px] ${buddy.isActive ? "justify-end" : "justify-start"} rounded-full bg-bluesh`}
                      onPress={() => toggleBuddySwitch(index)} // Pass the index to toggle the correct buddy
                    >
                      <View
                        className={` ${buddy.isActive ? "bg-blue-600" : "bg-blue-300"} w-[25px] h-[25px]  rounded-full`}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
            <View className="flex-row w-full items-center justify-between mt-2">
              <Text className="text-sm text-blue-500">
                {buddy.yourChildName}&apos;s Buddy
              </Text>
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {buddy.phoneNumber}
                </Text>
              </View>
            </View>
            <View className="flex-row w-full items-center justify-between mt-2">
              <Text className="text-sm text-green-500">
                {buddy.parentName}&apos;s Child
              </Text>
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {buddy.parentPhoneNumber}
                </Text>
              </View>
            </View>
            {/* </View> */}
          </TouchableOpacity>
        ))}

        <Text className="text-xl font-light mt-4">New Buddy Request</Text>

        {newBuddyRequests.map((buddy: NewBuddyRequest, index: number) => (
          <View
            key={index}
            className="flex-col items-center mt-4 bg-white p-4 rounded-lg shadow-sm w-full"
          >
            <View className="flex-1 w-full items-start gap-2 mt-2 flex-row">
              <Image source={buddy.image} className="w-12 h-12 rounded-full" />

              <View className="ml-4 flex-1 items-start justify-start flex-col">
                <View className="flex-row items-center w-full justify-between">
                  <Text className="text-lg font-semibold mb-[-4px]">
                    {buddy.name}
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row w-full items-center justify-between mt-2">
              <Text className="text-sm text-blue-500">
                {buddy.yourChildName}&apos;s Buddy
              </Text>
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {buddy.phoneNumber}
                </Text>
              </View>
            </View>
            <View className="flex-row w-full items-center justify-between mt-2">
              <Text className="text-sm text-green-500">
                {buddy.parentName}&apos;s Child
              </Text>
              <View className="ml-2">
                <Text className="text-sm text-gray-500">
                  {buddy.parentPhoneNumber}
                </Text>
              </View>
            </View>
            <View className="flex-1 flex-row justify-between w-full mt-4">
              <TouchableOpacity
                className="bg-redsh px-4 py-2 rounded-lg"
                onPress={() => {
                  console.log("Reject Buddy Request");
                }}
              >
                <Text className="text-white">Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-greensh px-4 py-2 rounded-lg"
                onPress={() => {
                  // Handle reject action here
                  console.log("Confirm Buddy Request");
                }}
              >
                <Text className="text-white">Confirms</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        <Text className="text-xl font-light mt-4">Find a Buddy</Text>
        <View className="flex-col items-center mt-4rounded-lg shadow-sm w-full">
          {newBuddies.map((buddy: Buddy, index: number) => (
            <View
              key={index}
              className="flex-col items-center mt-4 bg-white p-4 rounded-lg shadow-sm w-full"
            >
              <View className="flex-1 w-full items-start gap-2 mt-2 flex-row">
                <Image
                  source={buddy.image}
                  className="w-12 h-12 rounded-full"
                />

                <View className="ml-4 flex-1 items-start justify-start flex-col">
                  <View className="flex-row items-center w-full justify-between">
                    <Text className="text-lg font-semibold mb-[-4px]">
                      {buddy.name}
                    </Text>
                  </View>
                </View>
              </View>
              <View className="flex-row w-full items-center justify-between mt-2">
                <Text className="text-sm text-blue-500">
                  {buddy.yourChildName}&apos;s Buddy
                </Text>
                <View className="ml-2">
                  <Text className="text-sm text-gray-500">
                    {buddy.phoneNumber}
                  </Text>
                </View>
              </View>
              <View className="flex-row w-full items-center justify-between mt-2">
                <Text className="text-sm text-green-500">
                  {buddy.parentName}&apos;s Child
                </Text>
                <View className="ml-2">
                  <Text className="text-sm text-gray-500">
                    {buddy.parentPhoneNumber}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-4 rounded-lg mt-4 w-full"
                onPress={() => {
                  handleOpenModal(buddy); // Open modal with the selected buddy
                  console.log("Send Buddy Request for", buddy.name);
                }}
              >
                <Text className="text-white text-center">Send Request</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white p-4 rounded-lg shadow-lg">
            <Text className="text-lg font-semibold mb-2">
              Send Buddy Request
            </Text>
            {selectedBuddy && (
              <Text className="text-sm text-gray-500 mb-4">
                Are you sure you want to send a buddy request to{" "}
                {selectedBuddy.name}?
              </Text>
            )}
            <View className="flex-col items-center mb-4 w-full">
              {yourChild.map((yourChild: child, index: number) => (
                <TouchableOpacity
                  key={index}
                  className={`flex-row items-center mb-2 bg-blue-100 py-2 px-4 rounded-lg w-full ${
                    selectedChild && selectedChild.childId === yourChild.childId
                      ? "border border-blue-500" // Changed from border-1 to border
                      : ""
                  }`}
                  onPress={() => {
                    setSelectedChild(yourChild); // Set selected child on press
                  }}
                >
                  <Image
                    source={yourChild.childimage}
                    className="w-12 h-12 rounded-full"
                  />
                  <Text className="ml-4">{yourChild.childname}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row justify-end">
              <TouchableOpacity
                className="bg-red-500 px-4 py-2 rounded-lg"
                onPress={handleCloseModal}
              >
                <Text className="text-white">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-500 px-4 py-2 rounded-lg ml-2"
                onPress={() => {
                  console.log("Confirm Buddy Request");
                  handleCloseModal();
                }}
              >
                <Text className="text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default BuddySystemScreen;
