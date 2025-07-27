import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { router } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function Index() {
  const handleGetStarted = () => {
    // Navigate to the parent_home screen within the (tabs) group
    router.replace("/LogingScreen"); // Use replace to prevent going back to onboarding
  };
  return (
    <View className="flex-1 items-center justify-center bg-light-100">
      <View className="absolute top-20 left-0 right-0 bottom-0 flex-1 items-center">
        <Image
          source={icons.logo}
          className="w-48 h-48" // <--- ADD WIDTH AND HEIGHT HERE (adjust as needed)
          resizeMode="contain" // Good for logos to fit within bounds
        />
        <Text className="text-primary text-4xl font-bold mt-4">
          Welcome to SafeBus!
        </Text>
        <Text className="text-darkbg px-12 pt-2 text-lg mt-2 text-center">
          Your trusted partner for a secure school journey. We connect parents,
          students, and drivers, ensuring peace of mind every mile of the way.
        </Text>
      </View>
      <Image
        source={images.bgchilds}
        className="absolute bottom-0 left-0 right-0 w-full h-1/2" // <--- ADD WIDTH AND HEIGHT HERE (adjust as needed)
        resizeMode="cover" // Good for background images
      />
      <TouchableOpacity
        className="absolute bottom-20 left-0 right-0 bg-primary p-4 rounded-full items-center mx-12"
        onPress={handleGetStarted}
      >
        <Text className="text-white text-lg">Get Start</Text>
      </TouchableOpacity>
    </View>
  );
}
