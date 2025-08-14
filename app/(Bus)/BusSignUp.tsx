// app/LoginScreen.tsx

import React, { useState } from "react";
import {
  ActivityIndicator,
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

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

// ✅ Prefer alias import so Router doesn't treat it as a route file
import { auth, db } from "../lib/firebase";

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string; // 'bus'
  userID: string; // uid
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
}

const BusSignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<User>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "bus",
    userID: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const savingSignUpData = async (userData: User) => {
    try {
      // Save user data to AsyncStorage WITHOUT PASSWORDS
      const { password, confirmPassword, ...dataToSave } = userData;
      await AsyncStorage.setItem("userData", JSON.stringify(dataToSave));
      console.log("User data saved successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
    }
  };

  const handleSignUp = async () => {
    // Basic validation
    if (!user.firstName || !user.lastName || !user.email || !user.password) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Missing info",
        textBody: "Please fill in all fields.",
        button: "close",
      });
      return;
    }

    if (user.password.length < 6) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Weak password",
        textBody: "Password must be at least 6 characters.",
        button: "close",
      });
      return;
    }

    if (user.password !== user.confirmPassword) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Passwords don’t match",
        textBody: "Please confirm your password.",
        button: "close",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(user.email)) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Invalid email",
        textBody: "Please enter a valid email address.",
        button: "close",
      });
      return;
    }

    try {
      setLoading(true);

      // 1) Create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        user.email.trim(),
        user.password
      );

      // 2) Set display name
      const displayName =
        `${user.firstName.trim()} ${user.lastName.trim()}`.trim();
      await updateProfile(cred.user, { displayName });

      // 3) Create Firestore user doc with role: "bus" at users/{uid}
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: user.email.trim().toLowerCase(),
        fullName: displayName,
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        role: "bus", // 👈 saved as 'bus'
        profileImage: user.profileImage ?? null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // 4) Save sanitized local snapshot incl. userID = uid
      await savingSignUpData({
        ...user,
        userID: cred.user.uid,
        // refresh timestamps locally
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Success",
        textBody: "Account created successfully.",
      });

      // 5) Reset local state
      setUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "bus",
        userID: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 6) Go to bus setup flow
      router.replace("/(Bus)/AccountSetUpScreen");
    } catch (e: any) {
      const code = e?.code || "";
      let message = e?.message || "Sign up failed.";
      if (code === "auth/email-already-in-use")
        message = "This email is already in use.";
      else if (code === "auth/invalid-email")
        message = "Invalid email address.";
      else if (code === "auth/weak-password") message = "Password is too weak.";

      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: message,
        button: "close",
      });
    } finally {
      setLoading(false);
    }
  };

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      {visible ? (
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="#666"
          strokeWidth="2"
        />
      ) : (
        <>
          <Path
            d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
            stroke="#666"
            strokeWidth="2"
          />
          <Path d="M1 1l22 22" stroke="#666" strokeWidth="2" />
        </>
      )}
      {visible && (
        <Path
          d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
          stroke="#666"
          strokeWidth="2"
        />
      )}
    </Svg>
  );

  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="flex-1 justify-center items-center mt-4">
          <Text className="text-3xl font-light text-primary">Bus Sign Up</Text>

          <View className="mt-10 w-full items-start flex-col ">
            {/* First Name */}
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

            {/* Last Name */}
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

            {/* Email */}
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

            {/* Password + Confirm */}
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

            {/* Submit */}
            <View className="mt-6 w-full">
              <TouchableOpacity
                className={`rounded-full p-4 items-center ${loading ? "bg-neutral-300" : "bg-primary"}`}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center text-lg font-medium">
                    Sign Up
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Already have an account */}
            <View className="mt-4 w-full flex-row justify-center">
              <Text className="text-center text-gray-500">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(Bus)/AccountSetUpScreen")}
              >
                <Text className="text-primary font-semibold">Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Image
            source={images.bgchilds}
            className="w-full h-64 mt-2"
            resizeMode="contain"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default BusSignUp;
