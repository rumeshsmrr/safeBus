import React from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header2 from "./Components/header2";

const scrollViewBottomPadding = 24;

interface childContact {
  name: string;
  phone: string;
}

const EmergencyScreen = () => {
  const childContact: childContact | null = {
    name: "John Doe",
    phone: "+1234567890",
  };

  /**
   * Function to initiate a phone call.
   * @param phoneNumber The phone number to dial.
   */
  const makeCall = (phoneNumber: string) => {
    if (phoneNumber) {
      // Ensure the phone number starts with 'tel:' for the dialer to recognize it
      const url = `tel:${phoneNumber}`;
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open dialer:", err);
        Alert.alert(
          "Error",
          "Could not initiate call. Please ensure your device supports calling or check the number."
        );
      });
    } else {
      console.warn("Phone number is missing for this contact.");
      Alert.alert("Error", "No phone number available for this contact.");
    }
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
        <Text className="text-2xl font-light mt-4">Emergency</Text>

        <View className="mt-4 flex-1 items-center justify-center">
          {Array.isArray(childContact)
            ? childContact.map((contact, idx) => (
                <TouchableOpacity
                  key={idx}
                  className="w-full bg-greensh rounded-xl shadow-md p-4 items-center justify-center mb-3"
                  //   onPress={() => console.log(`Contacting ${contact.name}`)}
                  // onpress want to dial the contact's phone number
                  onPress={() => makeCall(contact.phone)}
                >
                  <Text className="text-xl text-darkbg font-bold">
                    Contact Child
                  </Text>
                  <Text className="text-darkbg">{contact.name}</Text>
                </TouchableOpacity>
              ))
            : childContact && (
                <TouchableOpacity
                  className="w-full h-[80px] bg-greensh rounded-xl shadow-md p-4 items-center justify-center"
                  onPress={() => makeCall(childContact.phone)}
                >
                  <Text className="text-xl text-darkbg font-bold">
                    Contact Child
                  </Text>
                  <Text className="text-darkbg">{childContact.name}</Text>
                </TouchableOpacity>
              )}
          <View className="mt-6 flex-row items-center justify-between w-full">
            <TouchableOpacity
              className="w-[48%] h-[80px] bg-bluesh rounded-xl shadow-md p-4 items-center justify-center"
              onPress={() => makeCall("+94779011093")} // Example emergency number
            >
              <Text className="text-xl text-darkbg font-bold">Contact Bus</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="w-[48%] h-[80px] bg-yellowsh rounded-xl shadow-md p-4 items-center justify-center"
              onPress={() => makeCall("+94779011093")} // Example emergency number
            >
              <Text className="text-xl text-darkbg font-bold">
                Contact Trusted
              </Text>
              <Text className="text-darkbg">My Husband</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            className="w-full h-[120px] bg-redsh rounded-xl shadow-md p-4 mt-6 items-center justify-center"
            onPress={() => makeCall("119")} // Example emergency number
          >
            <Text className="text-4xl text-darkbg font-bold">119</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-full h-[80px] bg-blue-500 rounded-xl shadow-md p-4 mt-6 items-center justify-center"
            onPress={() => makeCall("1990")}
          >
            <Text className="text-4xl text-darkbg font-bold">1990</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
export default EmergencyScreen;
