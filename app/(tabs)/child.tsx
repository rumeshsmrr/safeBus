import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import {
  subscribeMyChildren,
  updateChildHomeLocation,
  updateChildSchoolLocation,
} from "@/data/users";
import { UserDoc } from "@/types/user";
import Header from "../Components/header";

// Map & geocoding
import * as Location from "expo-location";
import MapView, {
  Marker,
  type LongPressEvent,
  type MarkerDragStartEndEvent,
  type Region,
} from "react-native-maps";

const scrollViewBottomPadding = 24;

type PickerMode = "home" | "school";

const ChildScreen = () => {
  const [children, setChildren] = useState<UserDoc[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Map picker modal state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>("home");
  const [pickerChildUid, setPickerChildUid] = useState<string | null>(null);

  const [region, setRegion] = useState<Region>({
    latitude: 6.9271, // Colombo default center
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [pin, setPin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("");

  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => {
      setChildren(kids);
      console.log("Subscribed children:", kids); // log the fresh list (not stale state)
      setLoading(false);
    });

    if (!unsub) setLoading(false);
    return () => {
      if (typeof unsub === "function") unsub();
    };
  }, []);

  const tempImage = images.childImage1;

  const getName = (u: UserDoc) =>
    u.fullName ||
    [u.firstName, u.lastName].filter(Boolean).join(" ") ||
    "Unnamed";

  const getHome = (u: UserDoc) => {
    const anyU = u as any;
    const loc = anyU.homeLocation || {};
    return {
      address: loc.address ?? "-",
      latitude:
        typeof loc.latitude === "number"
          ? loc.latitude
          : typeof loc.lat === "number"
            ? loc.lat
            : null,
      longitude:
        typeof loc.longitude === "number"
          ? loc.longitude
          : typeof loc.lng === "number"
            ? loc.lng
            : null,
    };
  };

  const getSchool = (u: UserDoc) => {
    const anyU = u as any;
    const loc = anyU.schoolLocation || {};
    return {
      address: loc.address ?? "-",
      latitude:
        typeof loc.latitude === "number"
          ? loc.latitude
          : typeof loc.lat === "number"
            ? loc.lat
            : null,
      longitude:
        typeof loc.longitude === "number"
          ? loc.longitude
          : typeof loc.lng === "number"
            ? loc.lng
            : null,
    };
  };

  // ---------- Map Picker helpers ----------
  const formatAddress = (r?: Location.LocationGeocodedAddress) => {
    if (!r) return "";
    const parts = [
      r.name,
      r.street,
      r.subregion || r.city,
      r.region,
      r.country,
      r.postalCode,
    ].filter(Boolean);
    return parts.join(", ");
  };

  const openPicker = async (child: UserDoc, mode: PickerMode) => {
    setPickerChildUid(child.uid!);
    setPickerMode(mode);
    setAddress("");
    setPin(null);

    // Center map to existing location if present
    const loc = mode === "home" ? getHome(child) : getSchool(child);
    if (typeof loc.latitude === "number" && typeof loc.longitude === "number") {
      setRegion((r) => ({
        ...r,
        latitude: loc.latitude!,
        longitude: loc.longitude!,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }));
      setPin({ latitude: loc.latitude!, longitude: loc.longitude! });
      setAddress(loc.address || "");
      setPickerVisible(true);
      return;
    }

    // Else try device location
    try {
      setGeoLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const cur = await Location.getCurrentPositionAsync({});
        setRegion((r) => ({
          ...r,
          latitude: cur.coords.latitude,
          longitude: cur.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }));
      }
    } catch {
      // keep default region
    } finally {
      setGeoLoading(false);
      setPickerVisible(true);
    }
  };

  const onMapLongPress = (e: LongPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
  };

  const onMarkerDragEnd = (e: MarkerDragStartEndEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
  };

  useEffect(() => {
    (async () => {
      if (!pin) return;
      try {
        const res = await Location.reverseGeocodeAsync(pin);
        setAddress(formatAddress(res[0]));
      } catch {
        setAddress("");
      }
    })();
  }, [pin]);

  const onSaveLocation = async () => {
    if (!pickerChildUid) {
      Alert.alert("Missing data", "Child ID is required.");
      return;
    }
    if (!pin) {
      Alert.alert("Choose a location", "Long-press on the map to drop a pin.");
      return;
    }
    const payload = {
      address: address || "Pinned location",
      latitude: pin.latitude,
      longitude: pin.longitude,
    };

    try {
      if (pickerMode === "home") {
        await updateChildHomeLocation(pickerChildUid, payload);
      } else {
        await updateChildSchoolLocation(pickerChildUid, payload);
      }
      Alert.alert("Saved", "Location updated successfully.");
      setPickerVisible(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to save location.");
    }
  };

  // Format coordinate value for display
  const fmtCoord = (val: number | null | undefined) =>
    typeof val === "number" ? val.toFixed(5) : "-";

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Header isCode={false} />

        <Text className="text-2xl font-light mt-4">My Child</Text>
        <Text className="text-xl font-light mt-4">Connected Child</Text>

        {/* Loading / Empty states */}
        {loading && (
          <View className="items-center justify-center py-10">
            <ActivityIndicator />
            <Text className="text-gray-500 mt-2">Loading…</Text>
          </View>
        )}

        {!loading && (!children || children.length === 0) && (
          <View className="flex-row items-center gap-4 bg-white p-4 rounded-lg shadow mt-4">
            <Text className="text-lg font-semibold text-gray-500">
              No children linked yet
            </Text>
          </View>
        )}

        {/* Children list */}
        {!loading && children && children.length > 0 && (
          <View className="flex-col gap-2 pt-4">
            {children.map((child, index) => {
              const home = getHome(child);
              const school = getSchool(child);
              const isLinked = Boolean(child.currentBusId);

              return (
                <View
                  key={child.uid ?? index}
                  className="flex-col gap-4 bg-white p-4 rounded-lg shadow"
                >
                  <View className="flex-row items-center gap-4">
                    <Image
                      source={tempImage}
                      className="h-12 w-12 rounded-full"
                    />
                    <View className="flex-1">
                      <Text className="text-lg font-semibold">
                        {getName(child)}
                      </Text>
                      <Text className="text-sm text-blue-700 font-light">
                        {isLinked ? "Linked to Bus" : "Not Linked to Bus"}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-col gap-2 border-t border-gray-200 pt-2">
                    <Text className="text-md text-grayText">Home:</Text>
                    <View className="flex-row items-center justify-between gap-2">
                      {/* left: icon + address (allow to shrink) */}
                      <View
                        className="flex-row items-center gap-2 flex-1"
                        style={{ minWidth: 0 }}
                      >
                        <Image
                          source={icons.homeLocationIcon}
                          className="h-4 w-4"
                        />
                        <Text
                          className="text-sm text-grayText flex-1"
                          numberOfLines={2} // -> or 1 if you prefer a single line
                          ellipsizeMode="tail"
                        >
                          {home.address || "-"}
                        </Text>
                      </View>

                      {/* right: coordinates (don’t shrink, keep short) */}
                      <View
                        className="flex-row gap-2"
                        style={{ flexShrink: 0 }}
                      >
                        <Text className="text-xs text-grayText">
                          {fmtCoord(home.latitude)}°
                        </Text>
                        <Text className="text-xs text-grayText">
                          {fmtCoord(home.longitude)}°
                        </Text>
                      </View>
                    </View>

                    <Text className="text-md text-grayText">School:</Text>
                    <View className="flex-row items-center justify-between gap-2">
                      <View
                        className="flex-row items-center gap-2 flex-1"
                        style={{ minWidth: 0 }}
                      >
                        <Image
                          source={icons.schoolLocationIcon}
                          className="h-4 w-4"
                        />
                        <Text
                          className="text-sm text-grayText flex-1"
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
                          {school.address || "-"}
                        </Text>
                      </View>

                      <View
                        className="flex-row gap-2"
                        style={{ flexShrink: 0 }}
                      >
                        <Text className="text-xs text-grayText">
                          {fmtCoord(school.latitude)}°
                        </Text>
                        <Text className="text-xs text-grayText">
                          {fmtCoord(school.longitude)}°
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="flex-row justify-between gap-2 border-t border-gray-200 pt-2">
                    <TouchableOpacity
                      className="bg-blue-500 py-2 px-4 min-w-[120px] rounded-lg"
                      onPress={() => openPicker(child, "home")}
                    >
                      <Text className="text-white text-center">Edit Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="bg-blue-500 py-2 px-4 min-w-[120px] rounded-lg"
                      onPress={() => openPicker(child, "school")}
                    >
                      <Text className="text-white text-center">
                        Edit School
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Map Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-light-100">
          <View className="px-5 py-4">
            <Text className="text-2xl font-semibold">
              {pickerMode === "home"
                ? "Pick Home Location"
                : "Pick School Location"}
            </Text>
            <Text className="text-gray-500 mt-1">
              Long-press to drop a pin. Drag the pin to fine-tune. We’ll fetch
              the address for you.
            </Text>
          </View>

          <View className="flex-1">
            {geoLoading && (
              <View className="absolute z-10 w-full items-center mt-4">
                <ActivityIndicator />
              </View>
            )}
            <MapView
              style={{ flex: 1 }}
              initialRegion={region}
              onRegionChangeComplete={setRegion as any}
              onLongPress={onMapLongPress}
            >
              {pin && (
                <Marker
                  draggable
                  coordinate={pin}
                  onDragEnd={onMarkerDragEnd}
                  title={pickerMode === "home" ? "Home" : "School"}
                  description={address}
                />
              )}
            </MapView>
          </View>

          <View className="px-5 py-4 bg-white border-t border-gray-200">
            <Text className="text-base text-gray-700" numberOfLines={2}>
              {address
                ? `Address: ${address}`
                : pin
                  ? "Finding address…"
                  : "No pin dropped yet"}
            </Text>
            <View className="flex-row gap-3 mt-3">
              <TouchableOpacity
                className="flex-1 bg-gray-200 py-3 rounded-lg"
                onPress={() => setPickerVisible(false)}
              >
                <Text className="text-center">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-500 py-3 rounded-lg"
                onPress={onSaveLocation}
              >
                <Text className="text-white text-center font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default ChildScreen;
