// app/ParentWelcomeScreen.tsx

import { images } from "@/constants/images";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ChildWelcomeScreen = () => {
  const [inputCode, setInputCode] = useState(["", "", "", "", "", ""]);
  const [fullInputCode, setFullInputCode] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Handle input changes for code entry
  interface HandleInputChangeParams {
    text: string;
    index: number;
  }

  const handleInputChange = ({ text, index }: HandleInputChangeParams) => {
    const newCode = [...inputCode];
    newCode[index] = text;
    setInputCode(newCode);

    // Update full code state
    const newFullCode = newCode.join("");
    setFullInputCode(newFullCode);

    // Auto-focus next input if current input has value and there's a next input
    if (text && index < inputCode.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  interface KeyPressEvent {
    nativeEvent: {
      key: string;
    };
  }

  interface HandleKeyPressParams {
    e: KeyPressEvent;
    index: number;
  }

  const handleKeyPress = (e: KeyPressEvent, index: number): void => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === "Backspace" && !inputCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-center items-center p-6 mt-4">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-8xl font-light text-primary mb-2">
              Welcome !
            </Text>
            <Text className="text-3xl text-green-800 font-medium">
              Sign Up Success
            </Text>
          </View>

          {/* Code Input Section */}
          <View className="w-full items-center mt-10 mb-8">
            <Text className="text-lg font-medium text-gray-700 mb-4">
              Enter Your Parent&#39;s Code
            </Text>

            {/* Code Input Fields */}
            <View className="flex-row justify-center space-x-2 mb-4">
              {inputCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="w-16 h-16 bg-white rounded-lg border-2 border-gray-200 text-center shadow-sm text-xl font-bold text-gray-800"
                  value={digit}
                  onChangeText={(text) => handleInputChange({ text, index })}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  maxLength={1}
                  keyboardType="numeric"
                  autoCapitalize="none"
                  textAlign="center"
                  placeholder=""
                />
              ))}
            </View>

            <Text className="text-sm text-gray-600 text-center mt-2 px-4">
              Enter The Code From Your Parent&#39;s Device
            </Text>

            {/* Display entered code for debugging */}
            {fullInputCode && (
              <Text className="text-sm text-blue-600 text-center mt-2">
                Entered Code: {fullInputCode}
              </Text>
            )}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={() => {
              if (fullInputCode === "555555") {
                router.push("/(Child)/(tabs)/child_home");
              }
            }}
            className="w-full bg-blue-500 rounded-full py-4 mb-8"
          >
            <Text className="text-white text-center text-lg font-semibold">
              Continue
            </Text>
          </TouchableOpacity>

          {/* Illustration */}
          <View className="flex-1 justify-end items-center">
            <Image
              source={images.bgchilds}
              className="w-auto h-96"
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChildWelcomeScreen;
