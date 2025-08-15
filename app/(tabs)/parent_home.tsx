// app/ParentHome.tsx
import { images } from "@/constants/images";
import { subscribeMyChildren } from "@/data/users";
import type { UserDoc as BaseUserDoc } from "@/types/user";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  type LatLng,
  type Region,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "../Components/header";

// Extend UserDoc to include 'status'
type UserDoc = BaseUserDoc & {
  status?: string;
};

/* ------------------ sizing ------------------ */
const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

/* ------------------ hardcoded locations (by child UID) ------------------
   Add ONLY the correct/verified coords you want to pin explicitly.
   Example below uses the child uid you shared earlier ("Seni Shiwaani").
-------------------------------------------------------------------------- */
const HARDCODED_LOC: Record<string, LatLng> = {
  // "8lVRLeylFSaaknQNhfacxBbkkID3": { latitude: 6.8856, longitude: 79.8596 }, // <- example
};

/* ------------------ helpers ------------------ */
const childDisplayName = (u: UserDoc) =>
  u.fullName ||
  [u.firstName, u.lastName].filter(Boolean).join(" ") ||
  "Unnamed";

/** Determine which coordinate to show for a child */
function getChildCoord(u: UserDoc): LatLng | undefined {
  // 1) Hardcoded (highest priority)
  if (u.uid && HARDCODED_LOC[u.uid]) return HARDCODED_LOC[u.uid];

  // 2) Firestore homeLocation if present
  const home = (u as any).homeLocation;
  if (
    home &&
    typeof home.latitude === "number" &&
    typeof home.longitude === "number"
  ) {
    return { latitude: home.latitude, longitude: home.longitude };
  }

  // 3) Firestore schoolLocation fallback
  const school = (u as any).schoolLocation;
  if (
    school &&
    typeof school.latitude === "number" &&
    typeof school.longitude === "number"
  ) {
    return { latitude: school.latitude, longitude: school.longitude };
  }

  // 4) Nothing available
  return undefined;
}

/* ------------------ main ------------------ */
const ParentHome = () => {
  const router = useRouter();

  const [children, setChildren] = useState<UserDoc[] | null>(null);
  const [loading, setLoading] = useState(true);

  // subscribe to the current logged-in parent's children
  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => {
      setChildren(kids);
      setLoading(false);
    });
    if (!unsub) setLoading(false);
    return () => unsub?.();
  }, []);

  const driver = { id: 1, name: "Madusha" }; // header info for cards

  // Map coords derived from actual children (or hardcoded overrides)
  const coords: { uid: string; name: string; coord: LatLng }[] = useMemo(() => {
    if (!children) return [];
    const list = children
      .map((c) => {
        const coord = getChildCoord(c);
        if (!coord) return null;
        return { uid: c.uid, name: childDisplayName(c), coord };
      })
      .filter(Boolean) as { uid: string; name: string; coord: LatLng }[];
    return list;
  }, [children]);

  const mapRef = useRef<MapView | null>(null);

  // Initial region fallback
  const initialRegion: Region = useMemo(() => {
    const first = coords[0]?.coord;
    return {
      latitude: first?.latitude ?? 6.9271, // Colombo fallback
      longitude: first?.longitude ?? 79.8612,
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    };
  }, [coords]);

  // Fit mini map after mount/update
  useEffect(() => {
    if (!mapRef.current || coords.length === 0) return;
    const c = coords.map((x) => x.coord);
    if (c.length === 1) {
      mapRef.current.animateToRegion(
        {
          ...initialRegion,
          latitude: c[0].latitude,
          longitude: c[0].longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        400
      );
    } else {
      mapRef.current.fitToCoordinates(c, {
        edgePadding: { top: 30, right: 30, bottom: 30, left: 30 },
        animated: true,
      });
    }
  }, [coords, initialRegion]);

  // Full-screen map modal
  const [mapVisible, setMapVisible] = useState(false);

  const openSystemMaps = (point: LatLng, label?: string) => {
    const name = encodeURIComponent(label || "Location");
    const { latitude, longitude } = point;
    const url =
      Platform.OS === "ios"
        ? `maps:0,0?q=${name}@${latitude},${longitude}`
        : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${name})`;
    Linking.openURL(url).catch(() => {});
  };

  // Footer & tab offsets (adjust to your layout)
  const FIXED_FOOTER_HEIGHT = 120;
  const TAB_BAR_HEIGHT = 70;
  const TAB_BAR_BOTTOM_MARGIN = 36;
  const EXTRA_PADDING_FOR_SCROLL = 20;
  const scrollViewBottomPadding =
    FIXED_FOOTER_HEIGHT +
    TAB_BAR_HEIGHT +
    TAB_BAR_BOTTOM_MARGIN +
    EXTRA_PADDING_FOR_SCROLL;

  // Actions grid button
  const Button = ({
    title,
    onPress,
    bgColor,
    navigateTo,
  }: {
    title: string;
    onPress?: () => void;
    bgColor?: string;
    navigateTo?: string;
  }) => {
    const handlePress = () => {
      if (navigateTo) router.push(navigateTo as any);
      else onPress?.();
    };
    return (
      <TouchableOpacity
        className="w-[48%] rounded-xl shadow-md px-4 py-6 mb-4 justify-center items-center flex-shrink-0"
        style={{ backgroundColor: bgColor ?? "#d2d2d2" }}
        onPress={handlePress}
      >
        <Text className="text-xl font-normal text-grayText text-center">
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={true} />

        {/* Loading / Empty */}
        {loading && (
          <View className="mt-6 items-center">
            <ActivityIndicator />
            <Text className="text-neutral-500 mt-2">Loading children…</Text>
          </View>
        )}

        {!loading && (!children || children.length === 0) && (
          <View className="mt-6 items-center">
            <Text className="text-neutral-500">No children linked yet.</Text>
          </View>
        )}

        {/* Child Cards (actual from DB) */}
        {!loading &&
          children &&
          children.map((child) => {
            const name = childDisplayName(child);
            // Update status logic to include "Dropped" if needed, or remove unreachable comparison below
            const status = child.currentBusId
              ? "On Bus"
              : child.status === "Dropped"
                ? "Dropped"
                : child.status === "AB"
                  ? "AB"
                  : "Unknown";
            const img = images.childImage1;

            return (
              <View
                key={child.uid}
                className="w-full bg-white mt-4 rounded-xl shadow-md"
              >
                <View className="flex-row items-start p-4">
                  <Image source={img} className="h-12 w-12 rounded-full" />
                  <View className="flex-row ml-4 flex-1 justify-between items-start">
                    <View className="flex-1">
                      <Text
                        className="text-xl font-semibold text-darkbg capitalize"
                        numberOfLines={1}
                      >
                        {name}
                      </Text>
                      <Text
                        className="text-grayText text-base"
                        numberOfLines={1}
                      >
                        Madusha School Bus Service
                      </Text>
                      <Text
                        className="text-grayText text-base"
                        numberOfLines={1}
                      >
                        Driver Name: Madusha
                      </Text>
                    </View>
                    <Text
                      className={`text-gray-700 px-3 py-1.5 rounded-full ${
                        status === "On Bus"
                          ? "bg-yellow-200"
                          : status === "Dropped"
                            ? "bg-green-200"
                            : status === "AB"
                              ? "bg-red-200"
                              : "bg-neutral-200"
                      }`}
                    >
                      {status}
                    </Text>
                  </View>
                </View>

                {/* You can render real notifications from DB if you add them later */}
                <View className="border-t border-gray-200 p-4 flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={() =>
                      child.currentBusId
                        ? router.push(
                            `/busDetails?busId=${encodeURIComponent(child.currentBusId)}`
                          )
                        : null
                    }
                  >
                    <Text
                      className={`text-blue-500 ${child.currentBusId ? "" : "opacity-40"}`}
                    >
                      View Bus
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => console.log("Contact Pressed")}
                  >
                    <Text className="text-blue-500">Contact</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => console.log("View Driver Pressed")}
                  >
                    <Text className="text-blue-500">View Driver</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        {/* Map + Emergency row */}
        {!loading && (
          <View className="flex-row w-full justify-between mt-4">
            {/* Mini-map card */}
            <View className="flex-1 h-[160px] bg-white rounded-xl shadow-md p-4 mr-2">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-semibold">Child Locations</Text>
                <TouchableOpacity onPress={() => setMapVisible(true)}>
                  <Text className="text-blue-600 text-sm">Expand</Text>
                </TouchableOpacity>
              </View>

              <MapView
                ref={mapRef}
                className="flex-1 rounded-md"
                provider={
                  Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
                }
                initialRegion={initialRegion}
                scrollEnabled={false}
                zoomEnabled={false}
                pitchEnabled={false}
                rotateEnabled={false}
              >
                {coords.map(({ uid, name, coord }) => (
                  <Marker key={uid} coordinate={coord} title={name}>
                    <View className="w-8 h-8 rounded-full overflow-hidden border-2 border-blue-500">
                      <Image
                        source={images.childImage1}
                        className="w-full h-full"
                      />
                    </View>
                  </Marker>
                ))}
              </MapView>
            </View>

            {/* Emergency CTA */}
            <TouchableOpacity
              className="w-[160px] h-[160px] bg-redsh rounded-xl shadow-md p-4 items-center justify-center ml-2"
              onPress={() => router.push("/EmergencyScreen")}
            >
              <Text className="text-xl text-grayText font-bold">Emergency</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row flex-wrap justify-between mt-6 w-full">
          <Button
            title="Notify Driver"
            navigateTo="NotifyDriverScreen"
            bgColor="#F8B959"
          />
          <Button
            title="Buddy System"
            navigateTo="BuddySystemScreen"
            bgColor="#F292F1"
          />
          <Button
            title="Lost & Found"
            navigateTo="LostFoundScreen"
            bgColor="#A9C9FB"
          />
          <Button
            title="Chat Bot"
            navigateTo="ChatBotScreen"
            bgColor="#129489"
          />
        </View>
      </ScrollView>

      {/* Full-screen map overlay (simple, no extra modal lib) */}
      {mapVisible && (
        <View className="absolute inset-0 bg-white">
          <SafeAreaView className="flex-1">
            <View className="px-4 py-3 flex-row items-center justify-between border-b border-neutral-200">
              <Text className="text-lg font-semibold">Child Locations</Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  disabled={coords.length === 0}
                  onPress={() =>
                    coords.length &&
                    openSystemMaps(coords[0].coord, coords[0].name)
                  }
                  className={`px-3 py-2 rounded-xl ${coords.length ? "bg-blue-600" : "bg-neutral-300"}`}
                >
                  <Text className="text-white">Open in Maps</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setMapVisible(false)}
                  className="px-3 py-2 rounded-xl bg-neutral-200"
                >
                  <Text>Close</Text>
                </TouchableOpacity>
              </View>
            </View>

            <MapView
              style={{ flex: 1 }}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              initialRegion={initialRegion}
              onMapReady={() => {
                setTimeout(() => {
                  if (!coords.length) return;
                  const c = coords.map((x) => x.coord);
                  if (c.length === 1) {
                    const s = c[0];
                    (mapRef.current as MapView | null)?.animateToRegion(
                      {
                        latitude: s.latitude,
                        longitude: s.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      },
                      400
                    );
                  } else {
                    (mapRef.current as MapView | null)?.fitToCoordinates(c, {
                      edgePadding: { top: 50, right: 50, bottom: 80, left: 50 },
                      animated: true,
                    });
                  }
                }, 150);
              }}
            >
              {coords.map(({ uid, name, coord }) => (
                <Marker key={uid} coordinate={coord} title={name}>
                  <View className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-600">
                    <Image
                      source={images.childImage1}
                      className="w-full h-full"
                    />
                  </View>
                </Marker>
              ))}
            </MapView>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ParentHome;
