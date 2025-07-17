import { images } from "@/constants/images";
import React from "react";
import {
  Dimensions,
  Image,
  Platform, // Import Platform to conditionally set map provider
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps"; // Import MapView, Marker, and PROVIDER_GOOGLE
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "./header";

// Get screen dimensions for responsive map sizing
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922; // Standard delta for a city view
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const ParentHome = () => {
  const driver = {
    id: 1,
    name: "Madusha",
  };

  const childs = [
    {
      id: "1",
      name: "Shenuki Dilsara",
      image: images.childImage1,
      status: "Dropped",
      Notification: [
        {
          id: "1",
          message: "Dropped at School",
          time: "10:30 AM",
        },
        {
          id: "2",
          message: "On Bus",
          time: "9:00 AM",
        },
      ],
      // Hardcoded location for Shenuki (near Colombo based on given coordinates)
      location: {
        latitude: 6.8856,
        longitude: 79.8596,
      },
    },
  ];

  // Define the height of your fixed footer here (adjust as per your actual footer)
  const FIXED_FOOTER_HEIGHT = 120; // Example height for the fixed footer content

  // Tab bar dimensions from _layout.tsx (adjust to your actual values)
  const TAB_BAR_HEIGHT = 70;
  const TAB_BAR_BOTTOM_MARGIN = 36;
  const EXTRA_PADDING_FOR_SCROLL = 20; // Extra padding for content above fixed footer

  // Calculate total padding needed at the bottom of the ScrollView
  const scrollViewBottomPadding =
    FIXED_FOOTER_HEIGHT +
    TAB_BAR_HEIGHT +
    TAB_BAR_BOTTOM_MARGIN +
    EXTRA_PADDING_FOR_SCROLL;

  // Calculate initial region to center between children if they exist
  let initialMapRegion = {
    latitude: 6.8856, // Default to Shenuki's location or a central point for Sri Lanka
    longitude: 79.8596,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  // Safely calculate average location if there are multiple children
  if (childs.length > 0) {
    if (childs.length === 1 && childs[0].location) {
      initialMapRegion = {
        latitude: childs[0].location.latitude,
        longitude: childs[0].location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
    } else if (childs.length > 1) {
      let totalLatitude = 0;
      let totalLongitude = 0;
      let validLocationsCount = 0;

      childs.forEach((child) => {
        if (child.location) {
          totalLatitude += child.location.latitude;
          totalLongitude += child.location.longitude;
          validLocationsCount++;
        }
      });

      if (validLocationsCount > 0) {
        initialMapRegion = {
          latitude: totalLatitude / validLocationsCount,
          longitude: totalLongitude / validLocationsCount,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
      }
    }
  }

  //button component
  const Button = ({
    title,
    onPress,
    bgColor,
  }: {
    title: string;
    onPress: () => void;
    bgColor?: string;
  }) => (
    <TouchableOpacity
      className="w-[48%] bg-black rounded-xl shadow-md px-4 py-6 mb-4 text-center justify-center flex items-center m-auto "
      style={
        bgColor ? { backgroundColor: bgColor } : { backgroundColor: "#d2d2d2" }
      }
      onPress={onPress}
    >
      <Text className="text-xl font-normal text-grayText mb-2 text-center ">
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      {/* Main scrollable content area */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={true} />

        {/* Child Cards */}
        {childs.map((item) => (
          <View
            key={item.id}
            className="w-full h-fit bg-white mt-4 rounded-xl shadow-md"
          >
            <View className="flex-row items-start p-4">
              <Image source={item.image} className="h-12 w-12 rounded-full" />
              <View className="flex-row ml-4 flex-1 justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-semibold text-darkbg capitalize">
                    {item.name}
                  </Text>
                  <Text className="text-grayText text-base">
                    Madusha School Bus Service
                  </Text>
                  <Text className="text-grayText text-base">
                    Driver Name: {driver.name}
                  </Text>
                </View>
                <Text
                  className={`text-gray-600 px-4 py-2 ${item.status === "On Bus" ? "bg-yellow-300" : item.status === "Dropped" ? "bg-green-300" : item.status === "AB" ? "bg-red-300" : ""} rounded-full`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <View className="border-t border-gray-200 p-4">
              <Text className="text-lg font-semibold mb-2">
                Recent Notifications
              </Text>
              {item.Notification.map((notification) => (
                <View
                  key={notification.id}
                  className="flex-row items-center justify-between mb-2"
                >
                  <Text className="text-grayText text-base">
                    {notification.message}
                  </Text>
                  <Text className="text-grayText text-sm">
                    {notification.time}
                  </Text>
                </View>
              ))}
            </View>
            <View className="border-t border-gray-200 p-4 flex-row items-center justify-between">
              <TouchableOpacity onPress={() => console.log("view bus pressed")}>
                <Text className="text-blue-500">View Bus</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => console.log("Contact Pressed")}>
                <Text className="text-blue-500">Contact</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => console.log("View Driver Pressed")}
              >
                <Text className="text-blue-500">View Driver</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Map and Emergency Section */}
        <View className="flex-row w-full justify-between mt-4">
          <View className="flex-1 h-[160px] bg-white rounded-xl shadow-md p-4 mr-2">
            <Text className="text-lg font-semibold mb-2">Child Locations</Text>
            <MapView
              className="flex-1 rounded-md" // Map takes full height of its parent View
              // Explicitly set provider to Google Maps for Android, Apple Maps for iOS by default
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={initialMapRegion} // Use the dynamically calculated region
              // Optional: Disable user interaction if you just want to show locations
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {childs.map(
                (child) =>
                  // Only show marker if child has a location
                  child.location && (
                    <Marker
                      key={child.id}
                      coordinate={child.location}
                      title={child.name}
                      description={child.status}
                    >
                      {/* Custom marker image for the child */}
                      <Image
                        source={child.image} // Use child's image for marker
                        className="h-8 w-8 rounded-full border-2 border-blue-500"
                      />
                    </Marker>
                  )
              )}
            </MapView>
          </View>
          <TouchableOpacity className="w-[160px] h-[160px] bg-redsh rounded-xl shadow-md p-4 items-center justify-center ml-2">
            <Text className="text-xl text-grayText font-bold">Emergency</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          {/* loop  */}
          <Button
            title="Notify Driver"
            onPress={() => console.log("Notify Driver Pressed")}
            bgColor="#F8B959"
          />
          <Button
            title="Buddy System"
            onPress={() => console.log("Buddy System Pressed")}
            bgColor="#F292F1"
          />

          <Button
            title="Lost & Found"
            onPress={() => console.log("Lost & Found Pressed")}
            bgColor="#A9C9FB"
          />
          <Button
            title="Chat Bot"
            onPress={() => console.log("Notify Driver Pressed")}
            bgColor="#129489"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ParentHome;
