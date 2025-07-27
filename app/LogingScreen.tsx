// app/LoginScreen.tsx
import { icons } from "@/constants/icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";

const LoginScreen = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    // Simulate API call delay for better UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      const loggedInUser = await login(email, password); // CHANGED: Get user data directly from login

      if (loggedInUser) {
        console.log("role", loggedInUser.role);

        if (loggedInUser.role === "parent") {
          router.replace("/(tabs)/parent_home");
        } else if (loggedInUser.role === "bus") {
          router.replace("/(Bus)/(tabs)/driver_home");
          // } else if (loggedInUser.role === "student") {
          //   // Add student route if needed
          //   router.replace("/(student)/dashboard");
        } else {
          Alert.alert("Login Success", "Unknown role. Please contact support.");
          router.replace("/");
        }
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (error) {
      setError("An error occurred during login. Please try again.");
      console.error("Login error:", error);
    }

    setLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100 justify-center items-center p-6">
      <ScrollView showsVerticalScrollIndicator={false} className="w-full">
        <View className="w-full justify-center items-center my-8">
          <Image
            source={icons.logo}
            className="w-32 h-32 mb-4"
            resizeMode="contain"
          />
          <Text className="text-primary text-4xl font-bold text-center">
            Welcome Back!
          </Text>
          <Text className="text-gray-600 text-lg mt-2 text-center">
            Log in to your SafeBus account
          </Text>
        </View>

        <View className="w-full mt-8">
          <Text className="text-base font-semibold text-gray-700 mb-2">
            Email
          </Text>
          <TextInput
            className="w-full p-4 bg-white rounded-lg border border-gray-300 text-base"
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!loading}
          />

          <Text className="text-base font-semibold text-gray-700 mt-4 mb-2">
            Password
          </Text>
          <TextInput
            className="w-full p-4 bg-white rounded-lg border border-gray-300 text-base"
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!loading}
          />

          {error ? (
            <Text className="text-red-500 text-sm mt-2 text-center">
              {error}
            </Text>
          ) : null}

          <TouchableOpacity
            className={`w-full p-4 rounded-lg mt-8 ${loading ? "bg-gray-400" : "bg-primary"} items-center`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-lg font-bold">Log In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="mt-4 items-center">
            <Text className="text-primary text-base">Forgot Password?</Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-600 text-base">
              Don&apos;t have an account?{" "}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LoginScreen;
