import { Stack } from "expo-router";
import { AlertNotificationRoot } from "react-native-alert-notification";
import { AuthProvider } from "./context/AuthContext";
import "./global.css"; // Import global styles

export default function RootLayout() {
  return (
    <AuthProvider>
      <AlertNotificationRoot
        theme="light" // Set the theme for the alert notifications
      >
        <Stack>
          {/* Onboarding and Auth screens */}
          <Stack.Screen name="Onboard" options={{ headerShown: false }} />
          <Stack.Screen name="LogingScreen" options={{ headerShown: false }} />
          <Stack.Screen
            name="SignUpMenuScreen"
            options={{ headerShown: false }}
          />

          {/* Main App Layout */}

          {/* Individual screens */}
          <Stack.Screen
            name="NotifyDriverScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EmergencyScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LostFoundScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="BuddySystemScreen"
            options={{ headerShown: false }}
          />
          <Stack.Screen name="ParentSignUp" options={{ headerShown: false }} />

          {/* Route Groups - These have their own _layout.tsx files */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(Bus)/(tabs)" options={{ headerShown: false }} />

          <Stack.Screen
            name="(Child)/ChildSignUp"
            options={{ headerShown: false }}
          />
        </Stack>
      </AlertNotificationRoot>
    </AuthProvider>
  );
}
