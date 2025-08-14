// app/(Bus)/AccountSetUpScreen.tsx
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, {
  MapPressEvent,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";

// Firebase
import { doc, GeoPoint, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

type Coords = { latitude: number; longitude: number } | null;
type PickerType = "start" | "end";

interface AccountSetUpInfo {
  firstName: string;
  lastName: string;
  busId: string;
  busNumber: string;
  busNickName: string;
  startAddress: string;
  endAddress: string;
  contactNumber: string;
}

/* ======================= Map Picker Modal ======================= */
interface MapPickerModalProps {
  visible: boolean;
  initialRegion: Region;
  onClose: () => void;
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
}

function MapPickerModal({
  visible,
  initialRegion,
  onClose,
  onConfirm,
}: MapPickerModalProps) {
  const mapRef = useRef<MapView | null>(null);
  const [selectedCoord, setSelectedCoord] = useState<Coords>(null);

  const animateTo = (lat: number, lng: number) => {
    mapRef.current?.animateToRegion(
      {
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      250
    );
  };

  const onMapPress = (e: MapPressEvent) => {
    const c = e.nativeEvent.coordinate;
    setSelectedCoord(c);
    animateTo(c.latitude, c.longitude);
  };

  React.useEffect(() => {
    if (!visible) setSelectedCoord(null);
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-5 pt-2 pb-3 border-b border-neutral-200">
          <Text className="text-xl font-bold text-neutral-900">
            Pick location
          </Text>
          <Text className="text-neutral-500 mt-1">
            Tap to drop a pin or drag to adjust
          </Text>
        </View>

        <MapView
          ref={(r) => {
            mapRef.current = r;
          }}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          onPress={onMapPress}
        >
          {selectedCoord && (
            <Marker
              coordinate={selectedCoord}
              draggable
              onDragEnd={(e) => {
                const c = e.nativeEvent.coordinate;
                setSelectedCoord(c);
                animateTo(c.latitude, c.longitude);
              }}
            />
          )}
        </MapView>

        <View className="p-4">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center py-3 rounded-xl bg-neutral-400"
            >
              <Text className="text-white text-base font-medium">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!selectedCoord}
              onPress={() => selectedCoord && onConfirm(selectedCoord)}
              className={`flex-1 items-center py-3 rounded-xl ${selectedCoord ? "bg-blue-600" : "bg-neutral-300"}`}
            >
              <Text className="text-white text-base font-medium">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

/* ========================= Main Screen ========================= */
const DEFAULT_REGION: Region = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 1.2,
  longitudeDelta: 1.2,
};

const AccountSetUpScreen: React.FC = () => {
  const [busAccount, setBusAccount] = useState<AccountSetUpInfo>({
    firstName: "",
    lastName: "",
    busId: "",
    busNumber: "",
    busNickName: "",
    startAddress: "",
    endAddress: "",
    contactNumber: "",
  });

  const [startCoords, setStartCoords] = useState<Coords>(null);
  const [endCoords, setEndCoords] = useState<Coords>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState<PickerType>("start");
  const [pickerRegion, setPickerRegion] = useState<Region>(DEFAULT_REGION);

  const [error, setError] = useState("");

  // Seed from local storage (optional)
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem("userData");
        const baseId = `bus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        if (data) {
          const u = JSON.parse(data);
          setBusAccount((prev) => ({
            ...prev,
            firstName: u?.firstName || "",
            lastName: u?.lastName || "",
            busId: prev.busId || baseId,
          }));
        } else {
          setBusAccount((prev) => ({ ...prev, busId: prev.busId || baseId }));
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const openPicker = (type: PickerType) => {
    setPickerType(type);
    const reuse = type === "start" ? startCoords : endCoords;
    setPickerRegion(
      reuse
        ? {
            latitude: reuse.latitude,
            longitude: reuse.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }
        : DEFAULT_REGION
    );
    setPickerVisible(true);
  };

  const handlePickerConfirm = (coords: {
    latitude: number;
    longitude: number;
  }) => {
    if (pickerType === "start") setStartCoords(coords);
    else setEndCoords(coords);
    setPickerVisible(false);
  };

  const pinChip = (coords: Coords) => (
    <View
      className={`self-start mt-2 px-3 py-1.5 rounded-full flex-row items-center ${coords ? "bg-green-100" : "bg-neutral-200"}`}
    >
      <MaterialCommunityIcons
        name={coords ? "map-marker-check-outline" : "map-marker-off-outline"}
        size={16}
        color={coords ? "#16a34a" : "#6b7280"}
      />
      <Text
        className={`${coords ? "text-green-800" : "text-neutral-700"} text-xs ml-1`}
      >
        {coords ? "Pin set" : "No pin yet"}
      </Text>
    </View>
  );

  const normalizePhone = (raw: string) =>
    raw.replace(/[^\d+]/g, "").replace(/^0/, "+94");

  // ---- Validation ----
  const nameOk = (v: string) => v.trim().length >= 2;
  const busNoOk = (v: string) => v.trim().length >= 4;
  const addressOk = (v: string) => v.trim().length >= 4;
  const phoneOk = (v: string) => /^\+?\d{9,15}$/.test(normalizePhone(v));

  const isFormValid = useMemo(() => {
    return (
      nameOk(busAccount.firstName) &&
      nameOk(busAccount.lastName) &&
      busNoOk(busAccount.busNumber) &&
      nameOk(busAccount.busNickName) &&
      addressOk(busAccount.startAddress) &&
      addressOk(busAccount.endAddress) &&
      startCoords &&
      endCoords &&
      phoneOk(busAccount.contactNumber)
    );
  }, [busAccount, startCoords, endCoords]);

  const inputWrapper = ({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    valid,
  }: {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    onChangeText: (t: string) => void;
    placeholder: string;
    keyboardType?: "default" | "phone-pad";
    valid: boolean | null;
  }) => (
    <View className="mb-4">
      <Text className="text-neutral-800 font-semibold mb-1">{label}</Text>
      <View
        className={`flex-row items-center rounded-xl border bg-white ${valid === false ? "border-red-400" : "border-neutral-300"} px-3`}
      >
        <Ionicons
          name={icon}
          size={18}
          color={valid === false ? "#ef4444" : "#64748b"}
        />
        <TextInput
          className="flex-1 px-3 py-3 text-base"
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || "default"}
          returnKeyType="next"
          placeholderTextColor="#94a3b8"
        />
        {value.length > 0 && (
          <MaterialCommunityIcons
            name={valid ? "check-circle" : "close-circle"}
            size={18}
            color={valid ? "#10b981" : "#ef4444"}
          />
        )}
      </View>
      {valid === false && (
        <Text className="text-red-500 text-xs mt-1">
          Please enter a valid {label.toLowerCase()}.
        </Text>
      )}
    </View>
  );

  const handleContinue = async () => {
    setError("");
    if (!isFormValid) {
      setError("Please complete all fields correctly and set both map pins.");
      return;
    }

    setIsLoading(true);

    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsLoading(false);
      setError("You must be logged in to complete setup.");
      return;
    }

    const busId =
      busAccount.busId ||
      `bus_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const payload = {
      firstName: busAccount.firstName.trim(),
      lastName: busAccount.lastName.trim(),
      busId,
      busNumber: busAccount.busNumber.trim(),
      busNickName: busAccount.busNickName.trim(),
      startAddress: busAccount.startAddress.trim(),
      endAddress: busAccount.endAddress.trim(),
      contactNumber: normalizePhone(busAccount.contactNumber),
      startCoords: startCoords
        ? new GeoPoint(startCoords.latitude, startCoords.longitude)
        : null,
      endCoords: endCoords
        ? new GeoPoint(endCoords.latitude, endCoords.longitude)
        : null,
      ownerUid: uid,
      role: "driver" as const,
      isSetupComplete: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "busProfiles", busId), payload, { merge: true });
      await setDoc(
        doc(db, "users", uid),
        { uid, role: "bus", currentBusId: busId, updatedAt: serverTimestamp() },
        { merge: true }
      );
      await AsyncStorage.setItem("busAccountData", JSON.stringify(payload));
      router.replace("/(Bus)/(tabs)/bus_home");
    } catch (e: any) {
      console.error("Save bus profile error:", e);
      setError(e?.message || "Failed to save account data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F6F7FB]">
      {/* Header gradient */}
      <LinearGradient
        colors={["#38bdf8", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ height: 140 }}
        className="rounded-b-3xl"
      >
        <SafeAreaView>
          <View className="px-6 pt-4 pb-3">
            <Text className="text-white text-2xl font-extrabold">
              Set Up Account
            </Text>
            <Text className="text-white/90 mt-1">
              Tell us about your bus and route
            </Text>
            {/* Step chips */}
            <View className="flex-row gap-2 mt-3">
              <View className="px-3 py-1 rounded-full bg-white/25">
                <Text className="text-white text-xs">Profile</Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-white/25">
                <Text className="text-white text-xs">Route</Text>
              </View>
              <View className="px-3 py-1 rounded-full bg-white/25">
                <Text className="text-white text-xs">Confirm</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView className="flex-1 -mt-8">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            className="px-6"
            contentContainerStyle={{ paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Error banner */}
            {!!error && (
              <View className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 mb-4">
                <Text className="text-red-600 text-sm">{error}</Text>
              </View>
            )}

            {/* Card: Driver & Bus */}
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-5">
              <Text className="text-neutral-900 font-bold text-lg mb-3">
                Driver & Bus
              </Text>

              {inputWrapper({
                label: "First Name",
                icon: "person-outline",
                value: busAccount.firstName,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, firstName: t })),
                placeholder: "e.g., Sandun",
                valid: busAccount.firstName.length
                  ? nameOk(busAccount.firstName)
                  : null,
              })}

              {inputWrapper({
                label: "Last Name",
                icon: "person-circle-outline",
                value: busAccount.lastName,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, lastName: t })),
                placeholder: "e.g., Perera",
                valid: busAccount.lastName.length
                  ? nameOk(busAccount.lastName)
                  : null,
              })}

              {inputWrapper({
                label: "Bus Number",
                icon: "bus-outline",
                value: busAccount.busNumber,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, busNumber: t })),
                placeholder: "e.g., ABC-1234",
                valid: busAccount.busNumber.length
                  ? busNoOk(busAccount.busNumber)
                  : null,
              })}

              {inputWrapper({
                label: "Bus Nickname",
                icon: "pricetag-outline",
                value: busAccount.busNickName,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, busNickName: t })),
                placeholder: "e.g., Blue Eagle",
                valid: busAccount.busNickName.length
                  ? nameOk(busAccount.busNickName)
                  : null,
              })}
            </View>

            {/* Card: Route */}
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-5">
              <Text className="text-neutral-900 font-bold text-lg mb-3">
                Route
              </Text>

              {/* Start Address + Pin */}
              {inputWrapper({
                label: "Start Address",
                icon: "location-outline",
                value: busAccount.startAddress,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, startAddress: t })),
                placeholder: "Actual start address",
                valid: busAccount.startAddress.length
                  ? addressOk(busAccount.startAddress)
                  : null,
              })}

              <View className="flex-row items-center justify-between">
                <Pressable
                  className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => openPicker("start")}
                >
                  <Ionicons name="pin-outline" size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Pick Start Pin
                  </Text>
                </Pressable>
                {pinChip(startCoords)}
              </View>

              {/* Mini map preview */}
              <View className="mt-3 rounded-xl overflow-hidden border border-neutral-200">
                <MapView
                  style={{ height: 120 }}
                  provider={PROVIDER_GOOGLE}
                  pointerEvents="none"
                  region={
                    startCoords
                      ? {
                          latitude: startCoords.latitude,
                          longitude: startCoords.longitude,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        }
                      : DEFAULT_REGION
                  }
                >
                  {startCoords && <Marker coordinate={startCoords} />}
                </MapView>
              </View>

              {/* End Address + Pin */}
              <View className="mt-5" />
              {inputWrapper({
                label: "End Address",
                icon: "flag-outline",
                value: busAccount.endAddress,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, endAddress: t })),
                placeholder: "Actual end address",
                valid: busAccount.endAddress.length
                  ? addressOk(busAccount.endAddress)
                  : null,
              })}

              <View className="flex-row items-center justify-between">
                <Pressable
                  className="bg-blue-600 rounded-xl px-4 py-3 flex-row items-center"
                  onPress={() => openPicker("end")}
                >
                  <Ionicons name="pin-outline" size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">
                    Pick End Pin
                  </Text>
                </Pressable>
                {pinChip(endCoords)}
              </View>

              {/* Mini map preview */}
              <View className="mt-3 rounded-xl overflow-hidden border border-neutral-200">
                <MapView
                  style={{ height: 120 }}
                  provider={PROVIDER_GOOGLE}
                  pointerEvents="none"
                  region={
                    endCoords
                      ? {
                          latitude: endCoords.latitude,
                          longitude: endCoords.longitude,
                          latitudeDelta: 0.02,
                          longitudeDelta: 0.02,
                        }
                      : DEFAULT_REGION
                  }
                >
                  {endCoords && <Marker coordinate={endCoords} />}
                </MapView>
              </View>
            </View>

            {/* Card: Contact */}
            <View className="bg-white rounded-2xl p-5 shadow-sm mb-5">
              <Text className="text-neutral-900 font-bold text-lg mb-3">
                Contact
              </Text>

              {inputWrapper({
                label: "Contact Number",
                icon: "call-outline",
                value: busAccount.contactNumber,
                onChangeText: (t) =>
                  setBusAccount((p) => ({ ...p, contactNumber: t })),
                placeholder: "+94XXXXXXXXX",
                keyboardType: "phone-pad",
                valid: busAccount.contactNumber.length
                  ? phoneOk(busAccount.contactNumber)
                  : null,
              })}
              <Text className="text-neutral-500 text-xs">
                Tip: Local numbers starting with 0 will be saved as +94…
              </Text>
            </View>
          </ScrollView>

          {/* Sticky bottom action bar */}
          <View className="absolute left-0 right-0 bottom-0 px-6 pb-6">
            <View className="bg-white rounded-2xl shadow-lg px-4 py-4 border border-neutral-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons
                    name={isFormValid ? "check-decagram" : "alert-decagram"}
                    size={20}
                    color={isFormValid ? "#10b981" : "#f59e0b"}
                  />
                  <Text className="ml-2 text-neutral-700">
                    {isFormValid
                      ? "All good to go"
                      : "Please complete required fields"}
                  </Text>
                </View>

                <TouchableOpacity
                  disabled={isLoading || !isFormValid}
                  onPress={handleContinue}
                  className={`rounded-xl px-5 py-3 ${isLoading || !isFormValid ? "bg-blue-400" : "bg-blue-600"}`}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold">Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Map Picker Modal */}
      {pickerVisible && (
        <MapPickerModal
          visible={pickerVisible}
          initialRegion={pickerRegion}
          onClose={() => setPickerVisible(false)}
          onConfirm={handlePickerConfirm}
        />
      )}
    </View>
  );
};

export default AccountSetUpScreen;
