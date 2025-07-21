import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import DateTimePicker from "@react-native-community/datetimepicker"; // Import the new DatePicker
import React, { useState } from "react"; // Import useState
import {
  Image,
  Platform,
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
  const [date, setDate] = useState(new Date()); // State to hold the selected date
  const [showPicker, setShowPicker] = useState(false); // State to control picker visibility

  const onChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowPicker(Platform.OS === "ios"); // On iOS, the picker stays open by default, close it here. On Android, it closes automatically.
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShowPicker(true);
  };

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
              className="flex-col gap-4 bg-white p-4 rounded-lg shadow"
            >
              {/* Wrap the two Views in a single View */}
              <View>
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
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date Picker Section */}
        <View className="mt-6">
          <Text className="text-lg font-normal mb-2">Choose Date</Text>
          <TouchableOpacity
            onPress={showDatepicker}
            className="bg-white p-4 rounded-full shadow justify-between flex-row items-center gap-2"
            style={{ height: 60 }} // Give it a fixed height for better touch area
          >
            <Text className="text-base text-grayText">
              {date.toLocaleDateString()} {/* Display selected date */}
            </Text>
            <Text className="text-base text-grayText">Select a date</Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"} // Use 'spinner' for iOS, 'default' for Android
              onChange={onChange}
              minimumDate={new Date()}
              maximumDate={
                new Date(new Date().setFullYear(new Date().getFullYear() + 1))
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default NotifyDriverScreen;
