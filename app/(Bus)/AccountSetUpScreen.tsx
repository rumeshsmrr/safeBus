// app/LoginScreen.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ALERT_TYPE, Dialog, Toast } from "react-native-alert-notification";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

// Placeholder for router if not using expo-router
const router = {
  push: (path: string) => {
    console.log(`Navigating to: ${path}`);
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
  busId: string;
  busNumber: string;
  busNickName: string;
  startLocation: string;
  endLocation: string;
  contactNumber: string;
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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const getUserData = async () => {
      try {
        const data = await AsyncStorage.getItem("userData");
        if (data) {
          const parsedData = JSON.parse(data);
          console.log("Retrieved user data from storage:", parsedData);
          setBusAccount((prev) => ({
            ...prev,
            firstName: parsedData.firstName || "",
            lastName: parsedData.lastName || "",
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
  }, []);

  const handleContinue = async () => {
    setIsLoading(true);

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

    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      title: "Success",
      textBody: "Account setup complete!",
    });
    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      <KeyboardAwareScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 24,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={Platform.OS === "ios"}
        extraHeight={130}
        extraScrollHeight={130}
        keyboardOpeningTime={250}
      >
        <View className="flex-1 justify-center items-center">
          <Text className="text-2xl font-light text-darkbg mb-10">
            Set Up Account
          </Text>

          <View className="w-full items-start flex-col">
            <Text className="text-lg font-medium text-darkbg mb-2 mt-2">
              First Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your first name"
              textContentType="name"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="next"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, firstName: text })
              }
              value={busAccount.firstName}
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
              returnKeyType="next"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, lastName: text })
              }
              value={busAccount.lastName}
            />

            <Text className="text-lg font-medium text-darkbg mb-2 mt-4">
              Bus Number
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter bus number (e.g., ABC-1234)"
              returnKeyType="next"
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
              returnKeyType="next"
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
              returnKeyType="next"
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
              returnKeyType="next"
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
              returnKeyType="done"
              onChangeText={(text) =>
                setBusAccount({ ...busAccount, contactNumber: text })
              }
              value={busAccount.contactNumber}
            />

            <View className="mt-8 w-full mb-6">
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
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
};

export default AccountSetUpScreen;
