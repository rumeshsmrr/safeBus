// app/(Bus)/AccountSetUpScreen.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
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
import { auth, db } from "../lib/firebase"; // <— use alias to src/lib

/* ========================== Types ========================== */
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
      <View className="flex-1 bg-white">
        <View className="pt-12 px-4 pb-2">
          <Text className="text-lg font-semibold text-neutral-900">
            Pick location on map
          </Text>
          <Text className="text-neutral-500 mt-1">
            Tap to drop a pin (drag to adjust)
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

        <View className="p-3">
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 items-center py-3 rounded-xl bg-neutral-400"
            >
              <Text className="text-white text-base">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={!selectedCoord}
              onPress={() => selectedCoord && onConfirm(selectedCoord)}
              className={`flex-1 items-center py-3 rounded-xl ${selectedCoord ? "bg-blue-600" : "bg-neutral-300"}`}
            >
              <Text className="text-white text-base">Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
      className={`self-start mt-1 px-3 py-1 rounded-full ${coords ? "bg-green-100" : "bg-neutral-200"}`}
    >
      <Text
        className={`${coords ? "text-green-800" : "text-neutral-700"} text-xs`}
      >
        {coords ? "Pin set" : "No pin yet"}
      </Text>
    </View>
  );

  const normalizePhone = (raw: string) =>
    raw.replace(/[^\d+]/g, "").replace(/^0/, "+94"); // quick Sri Lanka normalization; tweak as needed

  const handleContinue = async () => {
    setIsLoading(true);

    const required =
      busAccount.firstName &&
      busAccount.lastName &&
      busAccount.busNumber &&
      busAccount.busNickName &&
      busAccount.startAddress &&
      busAccount.endAddress &&
      startCoords &&
      endCoords &&
      busAccount.contactNumber;

    if (!required) {
      alert("Please complete all fields and pick both map pins.");
      setIsLoading(false);
      return;
    }

    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("You must be logged in to complete setup.");
      setIsLoading(false);
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
      isSetupComplete: true, // <-- flag
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      // 1) Save the bus profile
      await setDoc(doc(db, "busProfiles", busId), payload, { merge: true });

      // 2) Link user
      await setDoc(
        doc(db, "users", uid),
        {
          uid,
          role: "bus",
          currentBusId: busId,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // 3) Local cache
      await AsyncStorage.setItem("busAccountData", JSON.stringify(payload));

      router.replace("/(Bus)/(tabs)/bus_home");
    } catch (e: any) {
      console.error("Save bus profile error:", e);
      alert(e?.message || "Failed to save account data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7FB]">
      <ScrollView
        className="px-6"
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mt-4 mb-6">
          <Text className="text-2xl text-neutral-900">Set Up Account</Text>
        </View>

        {/* First Name */}
        <Text className="text-base text-neutral-900 mb-1">First Name</Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-3 text-base"
          placeholder="Enter your first name"
          value={busAccount.firstName}
          onChangeText={(t) => setBusAccount((p) => ({ ...p, firstName: t }))}
          returnKeyType="next"
        />

        {/* Last Name */}
        <Text className="text-base text-neutral-900 mb-1">Last Name</Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-3 text-base"
          placeholder="Enter your last name"
          value={busAccount.lastName}
          onChangeText={(t) => setBusAccount((p) => ({ ...p, lastName: t }))}
          returnKeyType="next"
        />

        {/* Bus Number */}
        <Text className="text-base text-neutral-900 mb-1">Bus Number</Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-3 text-base"
          placeholder="Enter bus number (e.g., ABC-1234)"
          value={busAccount.busNumber}
          onChangeText={(t) => setBusAccount((p) => ({ ...p, busNumber: t }))}
          returnKeyType="next"
        />

        {/* Bus Nickname */}
        <Text className="text-base text-neutral-900 mb-1">Bus Nickname</Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-3 text-base"
          placeholder="Enter a nickname for the bus"
          value={busAccount.busNickName}
          onChangeText={(t) => setBusAccount((p) => ({ ...p, busNickName: t }))}
          returnKeyType="next"
        />

        {/* Start Address + Pin */}
        <Text className="text-base text-neutral-900 mb-1">Start Address</Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-2 text-base"
          placeholder="Enter the actual start address"
          value={busAccount.startAddress}
          onChangeText={(t) =>
            setBusAccount((p) => ({ ...p, startAddress: t }))
          }
          returnKeyType="done"
        />
        <View className="flex-row items-center mb-1">
          <TouchableOpacity
            className="bg-blue-600 rounded-full px-4 py-3"
            onPress={() => openPicker("start")}
          >
            <Text className="text-white font-semibold">Pick Pin</Text>
          </TouchableOpacity>
          <View className="ml-3">{pinChip(startCoords)}</View>
        </View>

        {/* End Address + Pin */}
        <Text className="text-base text-neutral-900 mt-4 mb-1">
          End Address
        </Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-2 text-base"
          placeholder="Enter the actual end address"
          value={busAccount.endAddress}
          onChangeText={(t) => setBusAccount((p) => ({ ...p, endAddress: t }))}
          returnKeyType="done"
        />
        <View className="flex-row items-center mb-1">
          <TouchableOpacity
            className="bg-blue-600 rounded-full px-4 py-3"
            onPress={() => openPicker("end")}
          >
            <Text className="text-white font-semibold">Pick Pin</Text>
          </TouchableOpacity>
          <View className="ml-3">{pinChip(endCoords)}</View>
        </View>

        {/* Contact Number */}
        <Text className="text-base text-neutral-900 mt-4 mb-1">
          Contact Number
        </Text>
        <TextInput
          className="bg-white rounded-full px-4 py-3 mb-5 text-base"
          placeholder="Enter contact number"
          keyboardType="phone-pad"
          value={busAccount.contactNumber}
          onChangeText={(t) =>
            setBusAccount((p) => ({ ...p, contactNumber: t }))
          }
          returnKeyType="done"
        />

        {/* Continue */}
        <TouchableOpacity
          disabled={isLoading}
          onPress={handleContinue}
          className={`rounded-full py-4 items-center ${isLoading ? "bg-blue-500/60" : "bg-blue-600"}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-base font-semibold">Continue</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Map Picker Modal */}
      {pickerVisible && (
        <MapPickerModal
          visible={pickerVisible}
          initialRegion={pickerRegion}
          onClose={() => setPickerVisible(false)}
          onConfirm={handlePickerConfirm}
        />
      )}
    </SafeAreaView>
  );
};

export default AccountSetUpScreen;
