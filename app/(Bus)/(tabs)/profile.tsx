// app/(tabs)/AccountScreen.tsx  (rename to your route as needed)
import { getUserById } from "@/data/users";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext"; // <-- uses your logout()

// NEW: Firestore imports (and your db)
import { db } from "@/app/lib/firebase"; // adjust if your path differs
import { collection, getDocs, query, where } from "firebase/firestore";

// NEW: Types for bus profile
type GeoPointLike =
  | { latitude: number; longitude: number }
  | { _lat: number; _long: number }
  | null;

type BusProfile = {
  id?: string;
  ownerUid: string;
  busId: string;
  busNickName?: string | null;
  busNumber?: string | null;
  contactNumber?: string | null;
  startAddress?: string | null;
  endAddress?: string | null;
  startCoords?: GeoPointLike;
  endCoords?: GeoPointLike;
  isSetupComplete?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

// NEW: small helper to show coordinates if no address
function fmtCoords(g?: GeoPointLike): string | undefined {
  if (!g) return undefined;
  // @ts-ignore
  if (typeof g.latitude === "number" && typeof g.longitude === "number") {
    // @ts-ignore
    return `${g.latitude.toFixed(5)}, ${g.longitude.toFixed(5)}`;
  }
  // @ts-ignore
  if (typeof g._lat === "number" && typeof g._long === "number") {
    // @ts-ignore
    return `${g._lat.toFixed(5)}, ${g._long.toFixed(5)}`;
  }
  return undefined;
}

// NEW: Firestore query to get the first bus profile by owner ID
async function getBusProfileByOwnerUid(
  ownerUid: string
): Promise<BusProfile | null> {
  if (!ownerUid) {
    throw new Error("getBusProfileByOwnerUid: ownerUid is missing");
  }
  console.log("[bus] querying busProfiles for ownerUid:", ownerUid);

  const ref = collection(db, "busProfiles"); // ✅ plural name here
  const q = query(ref, where("ownerUid", "==", ownerUid));
  const snap = await getDocs(q);

  if (snap.empty) return null;
  const d0 = snap.docs[0];
  return { id: d0.id, ...(d0.data() as BusProfile) };
}

const AccountScreen: React.FC = () => {
  const { logout, isLoading } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [user, setUser] = useState<any>({});

  // NEW: bus profile state
  const [bus, setBus] = useState<BusProfile | null>(null);
  const [busLoading, setBusLoading] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await Haptics.selectionAsync();
      await logout(); // ✅ your AuthContext clears storage
      router.replace("/LogingScreen"); // ✅ route name fixed
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setSigningOut(false);
    }
  };

  //get info from storage
  const getUserInfo = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("user");
      if (userDataString) {
        const parsedUser = JSON.parse(userDataString);
        console.log("User data retrieved successfully:", parsedUser);
        const uid = parsedUser.id;

        const userDoc = await getUserById(uid);
        if (userDoc) {
          setUser(userDoc);
          console.log("User data retrieved successfully:", userDoc);
        }

        // NEW: fetch bus profile for this owner
        setBusLoading(true);
        const busDoc = await getBusProfileByOwnerUid(uid);
        setBus(busDoc);
      }
    } catch (e) {
      console.error("Error retrieving user/bus data:", e);
      setBus(null);
    } finally {
      setBusLoading(false);
    }
  };

  useEffect(() => {
    getUserInfo();
  }, []);

  return (
    <View className="flex-1 bg-[#F6F7FB]">
      <StatusBar barStyle="light-content" />

      {/* Header (no absolute positioning, no overlap) */}
      <LinearGradient
        colors={["#0ea5e9", "#2563eb"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-[140px] rounded-b-3xl"
      >
        <SafeAreaView>
          <View className="px-6 pt-2 pb-4">
            <Text className="text-white text-2xl font-extrabold">Account</Text>
            <Text className="text-white/90 mt-1">Manage your session</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <SafeAreaView className="flex-1">
        <ScrollView
          className="px-6"
          contentContainerStyle={{ paddingVertical: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Session Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <Ionicons name="person-outline" size={20} color="#2563eb" />
              </View>
              <View className="ml-3">
                <Text className="text-neutral-900 font-semibold">
                  Signed in
                </Text>
                <Text className="text-neutral-500 text-sm">
                  You are currently authenticated
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View className="h-px bg-neutral-200 my-5" />

            {/* Logout section */}
            <Text className="text-neutral-900 font-semibold mb-2">
              Sign out
            </Text>
            <Text className="text-neutral-500 text-sm mb-3">
              You’ll be returned to the login screen.
            </Text>

            <TouchableOpacity
              disabled={signingOut || isLoading}
              onPress={() => setConfirmOpen(true)}
              className={`rounded-xl flex-row items-center justify-center px-4 py-3 ${
                signingOut || isLoading ? "bg-red-400" : "bg-red-600"
              }`}
              activeOpacity={0.9}
            >
              {signingOut || isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-out-outline" size={18} color="#fff" />
                  <Text className="text-white font-semibold ml-2">Log Out</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* NEW: Bus Profile Card */}
          <View className="bg-white rounded-2xl p-5 shadow-sm mt-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center">
                  <Ionicons name="bus-outline" size={20} color="#059669" />
                </View>
                <View className="ml-3">
                  <Text className="text-neutral-900 font-semibold">
                    Bus Profile
                  </Text>
                  <Text className="text-neutral-500 text-sm">
                    Linked to your account
                  </Text>
                </View>
              </View>

              {bus ? (
                <View className="px-2 py-1 rounded-full border border-neutral-200">
                  <Text className="text-[12px] text-neutral-700">
                    {bus.isSetupComplete ? "Setup Complete" : "Draft"}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="h-px bg-neutral-200 my-5" />

            {busLoading ? (
              <ActivityIndicator />
            ) : bus ? (
              <>
                <Row label="Bus ID" value={bus.busId} />
                <Row label="Bus Number" value={bus.busNumber ?? "—"} />
                <Row label="Nickname" value={bus.busNickName ?? "—"} />
                <Row label="Contact" value={bus.contactNumber ?? "—"} />
                <View className="h-px bg-neutral-200 my-3" />
                <Row
                  label="Start"
                  value={bus.startAddress || fmtCoords(bus.startCoords) || "—"}
                />
                <Row
                  label="End"
                  value={bus.endAddress || fmtCoords(bus.endCoords) || "—"}
                />
              </>
            ) : (
              <Text className="text-neutral-600">
                No bus profile found for this account.
              </Text>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Confirmation modal */}
      <Modal
        visible={confirmOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmOpen(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-8">
          <View className="w-full bg-white rounded-2xl p-5">
            <Text className="text-neutral-900 font-bold text-lg">Log out?</Text>
            <Text className="text-neutral-600 mt-1">
              Are you sure you want to sign out of your account?
            </Text>

            <View className="flex-row mt-5 gap-3">
              <Pressable
                onPress={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-neutral-300 items-center justify-center px-4 py-3"
              >
                <Text className="text-neutral-800 font-medium">Cancel</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setConfirmOpen(false);
                  handleLogout();
                }}
                className="flex-1 rounded-xl bg-red-600 items-center justify-center px-4 py-3"
              >
                <Text className="text-white font-semibold">Log Out</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// NEW: tiny row component just for this screen
function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <Text className="text-neutral-500 text-[13px]">{label}</Text>
      <Text
        className="text-neutral-900 text-[15px] ml-3 flex-1 text-right"
        numberOfLines={1}
      >
        {value ?? "—"}
      </Text>
    </View>
  );
}

export default AccountScreen;
