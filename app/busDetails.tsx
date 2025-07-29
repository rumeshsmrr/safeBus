import React from "react";
import {
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { images } from "@/constants/images";
import { useLocalSearchParams, useRouter } from "expo-router";
import Header from "./Components/header";

const scrollViewBottomPadding = 24; // Define the padding value

interface Driver {
  name: string;
  rating: string;
  isPrimary: boolean;
}

interface Child {
  id: string;
  name: string;
  image: any; // Changed from string to any for local images
  isLinked: boolean;
}

const Bus = () => {
  const router = useRouter();
  const [selectedChild, setSelectedChild] = React.useState<Child | null>(null);
  const [isRateModelVisible, setIsRateModelVisible] = React.useState(false);

  // Add new states for driver rating
  const [selectedDriver, setSelectedDriver] = React.useState<
    (Driver & { index: number }) | null
  >(null);
  const [rating, setRating] = React.useState(0);

  const handleRatePress = () => {
    setIsRateModelVisible(true);
  };

  const closeRateMode = () => {
    // Reset rating states when closing
    setSelectedDriver(null);
    setRating(0);
    setIsRateModelVisible(false);
  };

  const tempImage = images.childImage1; // Assuming this is the correct path to the image

  const [isAddChildModalVisible, setIsAddChildModalVisible] =
    React.useState(false);

  const driverList = [
    { name: "Madusha Nayajith", rating: "4.7 / 5", isPrimary: true },
    { name: "John Doe", rating: "4.5 / 5", isPrimary: false },
    { name: "Jane Smith", rating: "4.8 / 5", isPrimary: false },
    { name: "Alice Johnson", rating: "4.6 / 5", isPrimary: false },
  ];

  const childList: Child[] = [
    {
      id: "1",
      name: "John Doe",
      image: tempImage, // This is now a local image reference
      isLinked: true,
    },
    {
      id: "2",
      name: "Jane Smith",
      image: tempImage, // This is now a local image reference
      isLinked: false,
    },
  ];

  const handleAppChildPress = () => {
    setIsAddChildModalVisible(true);
  };
  const closeAddMode = () => {
    setIsAddChildModalVisible(false);
  };

  // Driver rating functions
  const handleDriverSelect = (driver: Driver, index: number) => {
    setSelectedDriver({ ...driver, index });
    setRating(0); // Reset rating when selecting a new driver
  };

  const handleStarPress = (starRating: number) => {
    setRating(starRating);
  };

  const handleSubmitRating = () => {
    if (selectedDriver && rating > 0) {
      console.log("Rating submitted:", {
        driver: selectedDriver,
        rating: rating,
      });
      // Reset states
      setSelectedDriver(null);
      setRating(0);
      setIsRateModelVisible(false);
    } else {
      alert("Please select a driver and provide a rating");
    }
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          className="mx-1"
        >
          <Text
            className={`text-3xl ${i <= rating ? "text-yellow-400" : "text-gray-300"}`}
          >
            ★
          </Text>
        </TouchableOpacity>
      );
    }
    return stars;
  };

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
    <TouchableOpacity
      className="w-[48%] bg-black rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
      style={
        bgColor ? { backgroundColor: bgColor } : { backgroundColor: "#d2d2d2" }
      }
      onPress={onPress}
    >
      <Text className="text-xl font-normal text-grayText text-center">
        {title}
      </Text>
    </TouchableOpacity>
  );

  const { busId } = useLocalSearchParams<{ busId: string }>();

  console.log("Bus ID from params:", busId);

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={false} />

        <Text className="text-2xl font-light mt-4">The Bus</Text>
        <Text className="text-xl font-light mt-4 ">Madusha School Bus</Text>
        <View className="flex-row justify-between gap-0 mt-4 items-center">
          <View className="flex-row gap-2 items-center">
            <Text className="font-light text-grayText">Maharagama</Text>
            <View className="w-3 h-3 bg-blue-700 rounded-full" />
          </View>
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
          <Button
            title="Notify Driver"
            onPress={() => router.push("/NotifyDriverScreen")}
            bgColor="#F8B959"
          />
          <Button
            title="Complaint"
            onPress={() => console.log("Complaint Pressed")}
            bgColor="#F85959"
          />
          <Button
            title="Add Child"
            onPress={() => setIsAddChildModalVisible(true)}
            bgColor="#A9C9FB"
          />
          <Button
            title="Rate Driver"
            onPress={() => handleRatePress()}
            bgColor="#F292F1"
          />
        </View>

        {/* Add Child Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isAddChildModalVisible}
          onRequestClose={closeAddMode}
        >
          <View className="flex-1 justify-center items-center bg-black/50 p-6">
            <View className="bg-white rounded-lg p-4 w-full">
              <Text className="text-xl font-light mb-4">Select Child</Text>
              {childList.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  className="flex-row items-center mb-4 p-2 bg-gray-50 rounded-lg"
                  onPress={() => {
                    setSelectedChild(child);
                    console.log("Selected child:", child.name);
                  }}
                >
                  <View className="w-12 h-12 rounded-full overflow-hidden mr-3 bg-gray-200">
                    <Image
                      source={child.image}
                      className="w-full h-full"
                      style={{ resizeMode: "cover" }}
                      onError={(error) => console.log("Image error:", error)}
                      onLoad={() => console.log("Image loaded successfully")}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg text-gray-800 font-medium">
                      {child.name}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {child.isLinked ? "Linked to bus" : "Not linked"}
                    </Text>
                  </View>
                  {selectedChild?.id === child.id && (
                    <View className="w-6 h-6 bg-blue-500 rounded-full justify-center items-center">
                      <Text className="text-white text-xs">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              <View className="w-full flex-row mt-4 justify-between gap-3">
                <TouchableOpacity
                  className="flex-1 px-4 bg-blue-500 py-3 rounded-lg"
                  onPress={() => {
                    console.log("Add new child pressed");
                    closeAddMode();
                  }}
                >
                  <Text className="text-white text-center text-lg font-light">
                    Add to Bus
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-6 bg-red-500 py-3 rounded-lg"
                  onPress={closeAddMode}
                >
                  <Text className="text-white text-center text-lg font-light">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>

      {/* Enhanced Rate Driver Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isRateModelVisible}
        onRequestClose={closeRateMode}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-lg p-6 w-full max-w-md max-h-[80%]">
            <Text className="text-xl font-light mb-6">Rate Driver</Text>

            {/* Driver Selection */}
            <Text className="text-lg font-medium mb-3">Select Driver:</Text>

            {driverList.map((driver, index) => (
              <TouchableOpacity
                key={index}
                className={`flex-row items-center mb-3 p-4 rounded-lg border-2 ${
                  selectedDriver?.index === index
                    ? "bg-blue-50 border-blue-500"
                    : "bg-gray-50 border-gray-200"
                }`}
                onPress={() => handleDriverSelect(driver, index)}
              >
                <View className="flex-1">
                  <Text className="text-lg text-gray-800 font-medium">
                    {driver.name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Current Rating: {driver.rating}
                  </Text>
                </View>
                {selectedDriver?.index === index && (
                  <View className="w-6 h-6 bg-blue-500 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Star Rating */}
            {selectedDriver && (
              <View className="mb-6">
                <Text className="text-lg font-medium mb-3">
                  Rate {selectedDriver.name}:
                </Text>
                <View className="flex-row justify-center items-center py-4">
                  {renderStars()}
                </View>
                {rating > 0 && (
                  <Text className="text-center text-gray-600 mt-2">
                    {rating} out of 5 stars
                  </Text>
                )}
              </View>
            )}

            {/* Action Buttons - Fixed at bottom */}
            <View className="w-full flex-row justify-between gap-3 mt-auto">
              <TouchableOpacity
                className={`flex-1 px-4 py-4 rounded-lg ${
                  selectedDriver && rating > 0 ? "bg-blue-500" : "bg-gray-300"
                }`}
                onPress={handleSubmitRating}
                disabled={!selectedDriver || rating === 0}
              >
                <Text
                  className={`text-center text-lg font-light ${
                    selectedDriver && rating > 0
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  Submit Rating
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="px-6 bg-red-500 py-4 rounded-lg"
                onPress={closeRateMode}
              >
                <Text className="text-white text-center text-lg font-light">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Bus;
