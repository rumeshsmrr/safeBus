// app/(tabs)/_layout.tsx
import { icons } from "@/constants/icons";
import { Tabs } from "expo-router";
import React from "react";
import { Image, Text, View } from "react-native";

// Corrected TabIcon component
const TabIcon = ({ focused, icon, title }: any) => {
  return focused ? (
    <View className="flex flex-col w-full flex-1 min-w-[70px] min-h-[70px] mt-9 justify-center items-center rounded-full overflow-hidden bg-light-100">
      <Image source={icon} tintColor="#151312" className="size-5" />
      {/* Removed ml-2, added mt-1 for spacing */}
      <Text className="text-darkbg text-base font-semibold mt-1">{title}</Text>
    </View>
  ) : (
    <View className="flex flex-col w-full flex-1 min-w-[70px] min-h-[70px] mt-9 justify-center items-center rounded-full overflow-hidden ">
      <Image source={icon} tintColor="#A8B5DB" className="size-5" />
      {/* Removed ml-2, added mt-1 for spacing */}
      <Text className="text-light-100 text-base font-semibold mt-1">
        {title}
      </Text>
    </View>
  );
};

const _layout = () => {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: "100%",
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarStyle: {
          backgroundColor: "#1F62FF",
          borderRadius: 50,
          marginHorizontal: 20,
          marginBottom: 36,
          height: 70,
          position: "absolute",
          // These justify-content and align-items here apply to the *tab bar itself*,
          // not the individual TabIcon content. The TabIcon's internal centering
          // is handled by its own flexbox styles.
          justifyContent: "center",
          alignItems: "center",
        },
      }}
    >
      <Tabs.Screen
        name="child_home"
        options={{
          title: "Child Home",
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon={icons.home} title="Home" />
          ),
        }}
      />
    </Tabs>
  );
};

export default _layout;
