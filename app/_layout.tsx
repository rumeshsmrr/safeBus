import { Stack } from "expo-router";
import "./global.css"; // Import global styles

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="Onboard" options={{ headerShown: false }} />
      <Stack.Screen
        name="NotifyDriverScreen"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="EmergencyScreen" options={{ headerShown: false }} />
      <Stack.Screen name="LostFoundScreen" options={{ headerShown: false }} />
      <Stack.Screen name="BuddySystemScreen" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
