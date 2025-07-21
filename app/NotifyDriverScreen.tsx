import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useState } from "react";
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

const scrollViewBottomPadding = 24;

interface Child {
  id: string;
  name: string;
  isLinked: boolean;
  image: any;
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

interface DefaultMessage {
  id: string;
  message: string;
}

interface sentMessags {
  id: string;
  message: string;
  date: Date;
  childId: string;
  childName: string;
  childImage: any;
}

const tempImage = images.childImage1;
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

const defaultMessages: DefaultMessage[] = [
  {
    id: "1",
    message: "Does not go to school",
  },
  {
    id: "2",
    message: "Not available for evening pickup",
  },
];

const NotifyDriverScreen = () => {
  // Allow date to be null initially
  const [date, setDate] = useState<Date | null>(null); // Change initial state to null
  const [showPicker, setShowPicker] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [sentMessages, setSentMessages] = useState<sentMessags[]>([]);

  const [selectedChildId, setSelectedChildId] = useState("1"); // Default to the first child

  const onChange = (event: any, selectedDate?: Date) => {
    // When the picker is dismissed (e.g., on Android when cancelling), selectedDate might be undefined.
    // We only update the date if a valid date was selected.
    setShowPicker(Platform.OS === "ios"); // For iOS, always close the picker after an action.

    if (selectedDate) {
      setDate(selectedDate);
    }
    // If selectedDate is undefined (user canceled on Android), we don't update the date state,
    // and the picker implicitly closes itself on Android.
  };

  const showDatepicker = () => {
    setShowPicker(true);
  };

  // Define today's date and a date one year from now for min/max
  const today = new Date();
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(today.getFullYear() + 1);

  //handle sending the message
  const handleSendMessage = () => {
    if (!date || !selectedMessage || !selectedChildId) {
      // Ensure all required fields are filled
      alert("Please select a date, message, and child.");
      return;
    }

    const child = selectedChild.find((c) => c.id === selectedChildId);
    if (!child) {
      alert("Selected child not found.");
      return;
    }

    const newMessage: sentMessags = {
      id: Math.random().toString(36).substring(7), // Generate a random ID
      message: selectedMessage,
      date: date,
      childId: child.id,
      childName: child.name,
      childImage: child.image,
    };

    setSentMessages([...sentMessages, newMessage]);
    setDate(null); // Reset date after sending
    setSelectedMessage(null); // Reset selected message after sending
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
        <Text className="text-2xl font-light mt-4">My Child</Text>
        <Text className="text-xl font-light mt-4 ">Connected Child</Text>
        <View className="flex-col gap-2 pt-4">
          {selectedChild.map((child: Child, index: number) => (
            <TouchableOpacity
              key={child.id} // Use child.id as key if available, otherwise index
              className={`flex-col gap-4 bg-white p-4 rounded-lg shadow ${
                selectedChildId === child.id ? "border border-black" : ""
              }`}
              onPress={() => setSelectedChildId(child.id)} // Update selected child on press
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
              {/* Conditionally display date or placeholder */}
              {date ? date.toLocaleDateString() : "Choose Date"}
            </Text>
            <Image source={icons.calender} style={{ height: 24, width: 24 }} />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              testID="dateTimePicker"
              // If date is null, provide a default starting date for the picker (e.g., today)
              value={date || today}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChange}
              minimumDate={today}
              maximumDate={oneYearFromNow}
            />
          )}
          <Text className="text-lg font-normal mb-2 mt-2 ">Choose Date</Text>
          <View className="flex-row gap-2">
            {defaultMessages.map((message) => (
              <TouchableOpacity
                key={message.id}
                className="bg-bluesh p-4 rounded-full shadow"
                onPress={() => setSelectedMessage(message.message)}
                style={{
                  borderColor:
                    selectedMessage === message.message
                      ? "black"
                      : "transparent",
                  borderWidth: selectedMessage === message.message ? 1 : 0,
                }}
              >
                <Text className="text-base text-grayText text-center">
                  {message.message}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <TouchableOpacity
          className="bg-blue-500 p-4 rounded-full shadow mt-6"
          onPress={handleSendMessage}
        >
          <Text className="text-base text-white text-center">Send Message</Text>
        </TouchableOpacity>

        <Text className="text-2xl font-light mt-6">Sent Messages</Text>
        <View className="flex-col gap-4 mt-4">
          {sentMessages.map((message) => {
            const dateObj =
              message.date instanceof Date
                ? message.date
                : new Date(message.date);
            return (
              <View
                key={message.id}
                className="flex-row items-center gap-4 bg-white p-4 rounded-lg shadow"
              >
                <Image
                  source={message.childImage}
                  style={{ height: 48, width: 48, borderRadius: 24 }}
                />
                {/* Apply flex-1 here to ensure this column takes up remaining space */}
                <View className="flex-col justify-between flex-1">
                  <View className="flex-row items-center justify-between">
                    {/* Make childName flexible to shrink if needed */}
                    <Text className="text-lg font-semibold flex-shrink-1">
                      {message.childName}
                    </Text>

                    {/* Make date/time flexible to shrink if needed, and ensure it wraps */}
                    <Text className="text-xs text-grayText text-right flex-shrink-1 ml-2">
                      {dateObj.toLocaleDateString()}{" "}
                      {dateObj.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                  {/* Ensure message wraps */}
                  <Text className="text-sm text-grayText mt-1">
                    {message.message}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default NotifyDriverScreen;
