// app/(Child)/(tabs)/child_profile.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

// Firebase
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

// Types
import type { UserDoc } from "@/types/user";

/* -------------------------- UI Helpers -------------------------- */

function displayName(u?: Partial<UserDoc> | null) {
  if (!u) return "—";
  const full =
    (u.fullName && u.fullName.trim()) ||
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  return full || u.email || "—";
}

function Initials({
  name,
  size = 56,
}: {
  name?: string | null;
  size?: number;
}) {
  const n = (name ?? "").trim();
  const initials =
    n
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "ST";
  return (
    <View
      style={{ width: size, height: size }}
      className="rounded-full bg-blue-100 items-center justify-center border border-white"
    >
      <Text className="text-blue-700 font-semibold">{initials}</Text>
    </View>
  );
}

function SectionCard({
  children,
  title,
  subtitle,
  right,
  className = "",
}: {
  children?: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <View
      className={`w-full bg-white/90 rounded-3xl p-5 mb-5 border border-neutral-100 shadow-sm ${className}`}
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 pr-3">
          <Text className="text-lg font-semibold text-neutral-900">
            {title}
          </Text>
          {!!subtitle && (
            <Text className="text-[12px] text-neutral-500 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
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

/* ------------------------ Main Component ------------------------ */

const ChildProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [child, setChild] = useState<UserDoc | null>(null);
  const [parent, setParent] = useState<UserDoc | null>(null);
  const [copying, setCopying] = useState(false);

  // Decorative background blobs (no deps)
  const BgDecor = () => (
    <>
      <View className="absolute -top-12 -right-10 w-52 h-52 bg-blue-100 rounded-full opacity-60" />
      <View className="absolute -top-24 -left-16 w-72 h-72 bg-indigo-100 rounded-full opacity-50" />
    </>
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        // Try cached user first
        const cached = await AsyncStorage.getItem("user");
        let uid: string | undefined;

        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            uid = parsed?.uid;
          } catch {}
        }
        if (!uid) uid = auth.currentUser?.uid || undefined;

        if (!uid) {
          if (mounted) {
            setChild(null);
            setParent(null);
          }
          return;
        }

        // Fetch child
        const childSnap = await getDoc(doc(db, "users", uid));
        if (!childSnap.exists()) {
          if (mounted) {
            setChild(null);
            setParent(null);
          }
          return;
        }
        const childDoc = {
          uid: childSnap.id,
          ...(childSnap.data() as any),
        } as UserDoc;
        if (!mounted) return;
        setChild(childDoc);

        // Fetch parent (if linked)
        if (childDoc.parentUid) {
          const pSnap = await getDoc(doc(db, "users", childDoc.parentUid));
          const parentDoc = pSnap.exists()
            ? ({ uid: pSnap.id, ...(pSnap.data() as any) } as UserDoc)
            : null;
          if (!mounted) return;
          setParent(parentDoc);
        } else {
          setParent(null);
        }
      } catch (e) {
        console.warn("Load profile error:", e);
        if (mounted) {
          setChild(null);
          setParent(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCopyParentCode = async () => {
    if (!parent?.parentCode) return;
    try {
      setCopying(true);
      await Clipboard.setStringAsync(parent.parentCode);
      if (Platform.OS === "android") {
        ToastAndroid.show("Copied parent code", ToastAndroid.SHORT);
      } else {
        Alert.alert("Copied", "Parent code copied to clipboard.");
      }
    } catch {
      Alert.alert("Error", "Could not copy the code. Please try again.");
    } finally {
      setCopying(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      await AsyncStorage.removeItem("user");
      router.replace("/LogingScreen");
    } catch (e) {
      console.error("Logout failed:", e);
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  /* ----------------------------- UI ----------------------------- */

  return (
    <SafeAreaView className="flex-1 bg-[#F7F8FB]">
      <View className="flex-1">
        {/* Hero */}
        <View className="px-6 pt-6 pb-4 overflow-visible">
          <View className="relative w-full bg-white rounded-3xl px-5 py-6 border border-neutral-100 shadow">
            <BgDecor />
            <View className="flex-row items-center">
              <Initials name={displayName(child)} />
              <View className="ml-4 flex-1">
                <Text
                  className="text-xl font-semibold text-neutral-900"
                  numberOfLines={1}
                >
                  {displayName(child)}
                </Text>
                <View className="flex-row items-center mt-1">
                  <Text className="text-[12px] px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                    {child?.role?.toString().toUpperCase() || "STUDENT"}
                  </Text>
                </View>
              </View>

              {/* Logout */}
              <TouchableOpacity
                onPress={handleLogout}
                className="px-3 py-2 rounded-full bg-neutral-900/90"
              >
                <Text className="text-white text-[12px]">Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            // Lightweight skeletons
            <>
              <SectionCard title="Student" subtitle="Your account details">
                <View className="h-4 bg-neutral-200 rounded mb-2 w-2/3" />
                <View className="h-4 bg-neutral-200 rounded mb-2 w-1/2" />
                <View className="h-4 bg-neutral-200 rounded mb-2 w-1/3" />
              </SectionCard>

              <SectionCard title="Linked Parent" subtitle="Primary contact">
                <View className="h-4 bg-neutral-200 rounded mb-2 w-2/3" />
                <View className="h-4 bg-neutral-200 rounded mb-2 w-1/2" />
                <View className="h-9 bg-neutral-200 rounded-xl mt-3" />
              </SectionCard>
            </>
          ) : (
            <>
              {/* Student */}
              <SectionCard title="Student" subtitle="Your account details">
                <InfoRow label="Name" value={displayName(child)} />
                <InfoRow label="Email" value={child?.email ?? "—"} />
                <InfoRow label="Role" value={child?.role ?? "student"} />
              </SectionCard>

              {/* Parent */}
              <SectionCard
                title="Linked Parent"
                subtitle={
                  parent ? "Primary contact on file" : "No parent linked yet"
                }
                right={
                  parent ? (
                    <View className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100">
                      <Text className="text-emerald-700 text-[12px]">
                        Linked
                      </Text>
                    </View>
                  ) : null
                }
              >
                {parent ? (
                  <>
                    <InfoRow label="Name" value={displayName(parent)} />
                    <InfoRow label="Email" value={parent.email ?? "—"} />

                    <View className="mt-3 p-3 bg-neutral-50 rounded-2xl border border-neutral-200">
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-[12px] text-neutral-500 mb-1">
                            Parent Code
                          </Text>
                          <Text className="text-[17px] font-semibold tracking-widest">
                            {parent.parentCode ?? "—"}
                          </Text>
                        </View>

                        <TouchableOpacity
                          disabled={!parent.parentCode || copying}
                          onPress={handleCopyParentCode}
                          className={`px-4 py-2 rounded-full ${
                            parent?.parentCode
                              ? "bg-blue-600"
                              : "bg-neutral-300"
                          }`}
                        >
                          {copying ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white text-[13px]">Copy</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text className="text-neutral-600">
                    Ask your parent for their code and link your account in the
                    welcome screen.
                  </Text>
                )}
              </SectionCard>

              {/* Danger zone */}
              <View className="mt-2">
                <TouchableOpacity
                  onPress={handleLogout}
                  className="w-full py-4 rounded-2xl bg-neutral-900 items-center"
                >
                  <Text className="text-white font-medium">Log Out</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default ChildProfile;
