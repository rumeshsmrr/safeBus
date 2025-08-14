// app/LoginScreen.tsx
import { icons } from "@/constants/icons";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "./context/AuthContext";

const STORAGE_KEY = "user";

const LoginScreen = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isCheckingStorage, setIsCheckingStorage] = useState(true);
  const [error, setError] = useState("");

  // Simple form validation
  const emailValid = useMemo(
    () => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
    [email]
  );
  const passwordValid = password.trim().length >= 6;
  const formValid = emailValid && passwordValid;

  useEffect(() => {
    checkStoredUser();
  }, []);

  const checkStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem(STORAGE_KEY); // FIX: read the same key you write
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        redirectBasedOnRole(userData.role);
      }
    } catch (e) {
      console.error("Error checking stored user:", e);
    } finally {
      setIsCheckingStorage(false);
    }
  };

  const redirectBasedOnRole = (role: string) => {
    switch (role) {
      case "parent":
        router.replace("/(tabs)/parent_home");
        break;
      case "bus":
        router.replace("/(Bus)/(tabs)/bus_home");
        break;
      case "student":
        router.replace("/(Child)/(tabs)/child_home");
        break;
      default:
        Alert.alert("Login Success", "Unknown role. Please contact support.");
        router.replace("/");
    }
  };

  const storeUserData = async (userData: any) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
      console.error("Error storing user data:", e);
    }
  };

  const handleLogin = async () => {
    if (!formValid) {
      setError(
        !emailValid
          ? "Please enter a valid email."
          : "Password must be at least 6 characters."
      );
      return;
    }

    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300)); // small UX delay

    try {
      const loggedInUser = await login(email.trim(), password);
      if (loggedInUser) {
        await storeUserData(loggedInUser);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        redirectBasedOnRole(loggedInUser.role);
        setEmail("");
        setPassword("");
      } else {
        setError("Invalid email or password. Please try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      console.error("Login error:", e);
      setError("An error occurred during login. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  if (isCheckingStorage) {
    return (
      <SafeAreaView className="flex-1 bg-light-100 justify-center items-center">
        <ActivityIndicator size="large" color="#0066CC" />
        <Text className="text-gray-600 mt-4">Checking login status...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />
      {/* Brand gradient background */}
      <LinearGradient
        colors={["#0ea5e9", "#2563eb", "#1e293b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="items-center mt-6">
              <Image
                source={icons.logo}
                className="w-28 h-28 mb-3"
                resizeMode="contain"
              />
              <Text className="text-white text-3xl font-extrabold">
                Welcome back
              </Text>
              <Text className="text-white/80 text-base mt-1">
                Log in to your SafeBus account
              </Text>
            </View>

            {/* Glass card */}
            <BlurView intensity={40} tint="light" className="mt-8 rounded-2xl">
              <View className="p-5 bg-white/70 rounded-2xl">
                {/* Email */}
                <Text className="text-gray-800 font-semibold mb-2">Email</Text>
                <View className="flex-row items-center rounded-xl border border-gray-300 bg-white">
                  <View className="pl-3">
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={
                        emailValid || email.length === 0 ? "#64748b" : "#ef4444"
                      }
                    />
                  </View>
                  <TextInput
                    className="flex-1 p-4 text-base"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    placeholderTextColor="#94a3b8"
                  />
                  {email.length > 0 && (
                    <View className="pr-3">
                      <MaterialCommunityIcons
                        name={emailValid ? "check-circle" : "close-circle"}
                        size={20}
                        color={emailValid ? "#10b981" : "#ef4444"}
                      />
                    </View>
                  )}
                </View>

                {/* Password */}
                <Text className="text-gray-800 font-semibold mt-4 mb-2">
                  Password
                </Text>
                <View className="flex-row items-center rounded-xl border border-gray-300 bg-white">
                  <View className="pl-3">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={
                        passwordValid || password.length === 0
                          ? "#64748b"
                          : "#ef4444"
                      }
                    />
                  </View>
                  <TextInput
                    className="flex-1 p-4 text-base"
                    placeholder="Enter your password"
                    secureTextEntry={secure}
                    value={password}
                    onChangeText={setPassword}
                    editable={!loading}
                    placeholderTextColor="#94a3b8"
                  />
                  <Pressable
                    className="pr-3 py-3"
                    onPress={() => setSecure((s) => !s)}
                    hitSlop={10}
                  >
                    <Ionicons
                      name={secure ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color="#64748b"
                    />
                  </Pressable>
                </View>

                {/* Error banner */}
                {!!error && (
                  <View className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3">
                    <Text className="text-red-600 text-sm text-center">
                      {error}
                    </Text>
                  </View>
                )}

                {/* Forgot password
                <TouchableOpacity
                  className="mt-3 self-end"
                  disabled={loading}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push("/ForgotPassword"); // adjust if needed
                  }}
                >
                  <Text className="text-primary font-semibold">Forgot Password?</Text>
                </TouchableOpacity> */}

                {/* Login button (gradient) */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={loading || !formValid}
                  className="mt-6 rounded-xl overflow-hidden"
                  onPress={handleLogin}
                >
                  <LinearGradient
                    colors={
                      loading || !formValid
                        ? ["#94a3b8", "#94a3b8"]
                        : ["#0ea5e9", "#2563eb"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 16, alignItems: "center" }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text className="text-white text-lg font-bold">
                        Log In
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                {/* <View className="flex-row items-center my-5">
                  <View className="flex-1 h-px bg-gray-300" />
                  <Text className="mx-2 text-gray-500 text-sm">or</Text>
                  <View className="flex-1 h-px bg-gray-300" />
                </View> */}

                {/* Social (placeholders) */}
                {/* <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 rounded-xl border border-gray-300 bg-white p-3 items-center"
                    disabled
                  >
                    <Text className="text-gray-700 font-semibold">
                      Continue with Google
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 rounded-xl border border-gray-300 bg-white p-3 items-center"
                    disabled
                  >
                    <Text className="text-gray-700 font-semibold">
                      Continue with Apple
                    </Text>
                  </TouchableOpacity>
                </View> */}

                {/* Sign up */}
                <View className="flex-row justify-center mt-6">
                  <Text className="text-gray-700">Don’t have an account? </Text>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      router.push("/SignUpMenuScreen");
                    }}
                  >
                    <Text className="text-primary font-semibold">Sign Up</Text>
                  </Pressable>
                </View>
              </View>
            </BlurView>

            {/* Footer note */}
            <View className="items-center mt-6">
              <Text className="text-white/70 text-xs">
                By continuing you agree to our Terms & Privacy Policy
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
