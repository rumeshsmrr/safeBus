// app/LoginScreen.tsx

import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ALERT_TYPE, Dialog, Toast } from "react-native-alert-notification";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { images } from "@/constants/images";
import { router } from "expo-router";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string; // 'parent' or 'child'
  userID: string; // Unique identifier for the user
  createdAt: string; // Timestamp of user creation
  updatedAt: string; // Timestamp of last update
  profileImage?: string; // Optional profile image URL
}

const ParentSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState<User>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent",
    userID: "", // This should be generated or fetched from your backend
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const handleSignUp = () => {
    // Validate user input
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Please fill in all fields.",
        button: "close",
      });
      return;
    }

    if (user.password !== user.confirmPassword) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Passwords do not match.",
        button: "close",
      });
      return;
    }

    //CHECK EMAIL FORMAT
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(user.email)) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: "Please enter a valid email address.",
        button: "close",
      });
      return;
    }

    // Here you would typically send the user data to your backend for registration
    console.log("User data:", user);
    Toast.show({
      type: ALERT_TYPE.SUCCESS,
      title: "Success",
      textBody: "Congrats! You have successfully signed up.",
    });
    // Reset user state after successful sign up
    setUser({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "parent",
      userID: "", // Reset or generate a new ID
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Navigate to the next screen after successful sign up
    router.push("/ParentWelcomeScreen");
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {visible ? (
        // Eye open icon
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="#666"
          strokeWidth="2"
          fill="none"
        />
      ) : (
        // Eye closed (eye with slash) icon
        <>
          <Path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#666"
            strokeWidth="2"
            fill="none"
          />
          <Path d="M1 1l22 22" stroke="#666" strokeWidth="2" />
        </>
      )}
      {visible && (
        <Path
          d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
          stroke="#666"
          strokeWidth="2"
          fill="none"
        />
      )}
    </Svg>
  );

  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="flex-1 justify-center items-center mt-4">
          <Text className="text-3xl font-light text-primary">
            Parent Sign Up
          </Text>
          <View className="mt-10 w-full items-start flex-col ">
            <Text className="text-xl font-medium text-darkbg mb-2 mt-2">
              First Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your first name"
              textContentType="name"
              autoCapitalize="words"
              autoComplete="name"
              onChange={(e) =>
                setUser({ ...user, firstName: e.nativeEvent.text })
              }
            />
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Last Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your last name"
              textContentType="name"
              autoCapitalize="words"
              autoComplete="name"
              onChange={(e) =>
                setUser({ ...user, lastName: e.nativeEvent.text })
              }
            />
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Email Address
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your email address"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoCapitalize="none"
              autoComplete="email"
              onChange={(e) => setUser({ ...user, email: e.nativeEvent.text })}
            />
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Password
            </Text>
            <View className="relative w-full">
              <TextInput
                className="bg-white rounded-full p-4 w-full pr-12"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                onChange={(e) =>
                  setUser({ ...user, password: e.nativeEvent.text })
                }
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowPassword(!showPassword)}
              >
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>

            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Confirm Password
            </Text>
            <View className="relative w-full">
              <TextInput
                className="bg-white rounded-full p-4 w-full pr-12"
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                onChange={(e) =>
                  setUser({ ...user, confirmPassword: e.nativeEvent.text })
                }
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <EyeIcon visible={showConfirmPassword} />
              </TouchableOpacity>
            </View>
            <View className="mt-6 w-full">
              <TouchableOpacity
                className="bg-primary rounded-full p-4"
                onPress={handleSignUp}
              >
                <Text className="text-white text-center text-lg font-medium">
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>
            <View className="mt-4 w-full flex-row justify-center">
              <Text className="text-center text-gray-500">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/LogingScreen")}>
                <Text className="text-primary font-semibold">Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Image
            source={images.bgchilds}
            className="w-full h-64 mt-2"
            resizeMode="contain"
            onError={(error) => console.log("Bottom image error:", error)}
            onLoad={() => console.log("Bottom image loaded")}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentSignUp;
