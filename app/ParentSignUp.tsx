// app/ParentSignUp.tsx
import { router } from "expo-router";
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

import { auth, db } from "@/app/lib/firebase";
import { images } from "@/constants/images";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "parent" | "child" | "driver";

interface SignUpState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: Role;
}

const ParentSignUp: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [user, setUser] = useState<SignUpState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "parent",
  });

  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
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
          <Path d="M2 2l20 20" stroke="#666" strokeWidth="2" />
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

  // ---- 6-digit code helpers ----
  const gen6 = () =>
    String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");

  const getUniqueParentCode = async (): Promise<string> => {
    for (let i = 0; i < 6; i++) {
      const code = gen6();
      const qSnap = await getDocs(
        query(collection(db, "users"), where("parentCode", "==", code))
      );
      if (qSnap.empty) return code;
    }
    throw new Error("Could not generate a unique code. Please try again.");
  };
  // -------------------------------

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

      // Create auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        user.email.trim(),
        user.password
      );

      // Set display name
      const displayName =
        `${user.firstName.trim()} ${user.lastName.trim()}`.trim();
      await updateProfile(cred.user, { displayName });

      // Generate unique 6-digit code
      const parentCode = await getUniqueParentCode();

      // Create Firestore profile (users/{uid})
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        email: user.email.trim().toLowerCase(),
        fullName: displayName,
        firstName: user.firstName.trim(),
        lastName: user.lastName.trim(),
        role: "parent",
        parentCode, // 👈 6-digit code stored here
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Toast.show({
        type: ALERT_TYPE.SUCCESS,
        title: "Success",
        textBody: `Account created. Your code: ${parentCode}`,
      });

      //store all saved user details with parent code, without password
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          uid: cred.user.uid,
          email: user.email.trim().toLowerCase(),
          fullName: displayName,
          firstName: user.firstName.trim(),
          lastName: user.lastName.trim(),
          role: "parent",
          parentCode, // 👈 6-digit code stored here
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      );

      // Reset local state
      setUser({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "parent",
      });

      // Navigate
      router.replace("/ParentWelcomeScreen");
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

  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="flex-1 justify-center items-center mt-4">
          <Text className="text-3xl font-light text-primary">
            Parent Sign Up
          </Text>

          <View className="mt-10 w-full items-start flex-col">
            {/* First Name */}
            <Text className="text-xl font-medium text-darkbg mb-2 mt-2">
              First Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your first name"
              textContentType="givenName"
              autoCapitalize="words"
              autoComplete="name-given"
              value={user.firstName}
              onChangeText={(t) => setUser((p) => ({ ...p, firstName: t }))}
              returnKeyType="next"
            />

            {/* Last Name */}
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Last Name
            </Text>
            <TextInput
              className="bg-white rounded-full p-4 w-full"
              placeholder="Enter your last name"
              textContentType="familyName"
              autoCapitalize="words"
              autoComplete="name-family"
              value={user.lastName}
              onChangeText={(t) => setUser((p) => ({ ...p, lastName: t }))}
              returnKeyType="next"
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
              value={user.email}
              onChangeText={(t) => setUser((p) => ({ ...p, email: t }))}
              returnKeyType="next"
            />

            {/* Password */}
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Password
            </Text>
            <View className="relative w-full">
              <TextInput
                className="bg-white rounded-full p-4 w-full pr-12"
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={user.password}
                onChangeText={(t) => setUser((p) => ({ ...p, password: t }))}
                textContentType="password"
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowPassword((v) => !v)}
              >
                <EyeIcon visible={showPassword} />
              </TouchableOpacity>
            </View>

            {/* Confirm Password */}
            <Text className="text-xl font-medium text-darkbg mb-2 mt-4">
              Confirm Password
            </Text>
            <View className="relative w-full">
              <TextInput
                className="bg-white rounded-full p-4 w-full pr-12"
                placeholder="Confirm your password"
                secureTextEntry={!showConfirmPassword}
                value={user.confirmPassword}
                onChangeText={(t) =>
                  setUser((p) => ({ ...p, confirmPassword: t }))
                }
                textContentType="password"
              />
              <TouchableOpacity
                className="absolute right-4 top-4"
                onPress={() => setShowConfirmPassword((v) => !v)}
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

            {/* Already have account */}
            <View className="mt-4 w-full flex-row justify-center">
              <Text className="text-center text-gray-500">
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.push("/LogingScreen")}>
                <Text className="text-primary font-semibold">Log In</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bottom image */}
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

export default ParentSignUp;
