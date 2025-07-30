// app/LoginScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ALERT_TYPE, Dialog, Toast } from "react-native-alert-notification"; // Assuming these are available
import { SafeAreaView } from "react-native-safe-area-context";

// Placeholder for router if not using expo-router
const router = {
  push: (path: string) => {
    console.log(`Navigating to: ${path}`);
    // In a real app, you'd use a navigation library here
    // For demonstration, we'll just log and show a toast
    Toast.show({
      type: ALERT_TYPE.INFO,
      title: "Navigation",
      textBody: `Attempted to navigate to ${path}`,
    });
  },
};

interface AccountSetUpInfo {
  firstName: string;
  lastName: string;
  busId: string; // Unique identifier for the bus driver
  busNumber: string; // Bus number or identifier
  busNickName: string;
  startLocation: string; // Starting location of the bus route
  endLocation: string; // Ending location of the bus route
  contactNumber: string; // Contact number for the bus driver
}

const AccountSetUpScreen = () => {
  const [busAccount, setBusAccount] = useState<AccountSetUpInfo>({
    firstName: "",
    lastName: "",
    busId: "",
    busNumber: "",
    busNickName: "",
    startLocation: "",
    endLocation: "",
    contactNumber: "",
  });
  const [isLoading, setIsLoading] = useState(false); // New loading state for button

  // useEffect to get info from AsyncStorage only once on component mount
  useEffect(() => {
    const getUserData = async () => {
      try {
        // Note: The previous component saved data under key "user", not "userData"
        const data = await AsyncStorage.getItem("userData");
        if (data) {
          const parsedData = JSON.parse(data);
          console.log("Retrieved user data from storage:", parsedData);
          // Update busAccount state with retrieved firstName and lastName
          setBusAccount((prev) => ({
            ...prev,
            firstName: parsedData.firstName || "",
            lastName: parsedData.lastName || "",
            // You might want to generate busId here or fetch from backend
            busId: `bus_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          }));
        } else {
          console.log("No user data found in storage.");
        }
      } catch (error) {
        console.error("Error retrieving user data:", error);
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Storage Error",
          textBody: "Failed to load initial user data.",
          button: "close",
        });
      }
    };

    getUserData();
  }, []); // Empty dependency array means this runs only once on mount

  // Handle continue button press
  const handleContinue = async () => {
    setIsLoading(true);

    // Basic validation (add more as needed)
    if (
      !busAccount.firstName ||
      !busAccount.lastName ||
      !busAccount.busNumber ||
      !busAccount.busNickName ||
      !busAccount.startLocation ||
      !busAccount.endLocation ||
      !busAccount.contactNumber
    ) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Please fill in all account setup fields.",
        button: "close",
      });
      setIsLoading(false);
      return;
    }

    // You would typically send this data to your backend
    console.log("Account setup data:", busAccount);

    try {
      // Simulate API call for account setup
      // await new Promise(resolve => setTimeout(resolve, 2000));

      // Optionally save the full busAccount info to AsyncStorage
      const busAccountString = JSON.stringify(busAccount);
      await AsyncStorage.setItem("busAccountInfo", busAccountString);
      console.log("Bus account info saved to storage:", busAccount);

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Success",
        textBody: "Account setup complete!",
      });

      // Navigate to the next screen after successful setup
      // router.push("/(Bus)/Dashboard"); // Example navigation
    } catch (error) {
      console.error("Account setup failed:", error);
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Setup Error",
        textBody: "An error occurred during account setup. Please try again.",
        button: "close",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="flex-1 justify-center items-center mt-4">
          <Text className="text-2xl font-light text-darkbg">
            Set Up Account
          </Text>
          <View className="mt-10 w-full items-start flex-col ">
            <Text className="text-lg font-medium text-darkbg mb-2 mt-2">
              First Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your first name"
              textContentType="name"
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, firstName: text })
              }
              value={busAccount.firstName} // Bind value to state
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Last Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your last name"
              textContentType="name"
              autoCapitalize="words"
              autoComplete="name"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, lastName: text })
              }
              value={busAccount.lastName} // Bind value to state
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Bus Number
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter bus number (e.g., ABC-1234)"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, busNumber: text })
              }
              value={busAccount.busNumber}
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Bus Nickname
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter a nickname for the bus"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, busNickName: text })
              }
              value={busAccount.busNickName}
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Start Location
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter starting location"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, startLocation: text })
              }
              value={busAccount.startLocation}
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              End Location
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter ending location"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, endLocation: text })
              }
              value={busAccount.endLocation}
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Contact Number
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter contact number"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, contactNumber: text })
              }
              value={busAccount.contactNumber}
            />

            <View className="mt-6 w-full">
              <TouchableOpacity
                className="bg-primary rounded-full p-4"
                onPress={handleContinue}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center text-lg font-medium">
                    Continue
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AccountSetUpScreen;
