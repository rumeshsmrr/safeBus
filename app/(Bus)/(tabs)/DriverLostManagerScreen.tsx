// app/DriverLostManagerScreen.tsx
import Header2 from "@/app/Components/header2";
import { icons } from "@/constants/icons";
import {
  claimLostReport,
  createFoundItem,
  deleteItem,
  markFoundAsReturned,
  resolveLostReport,
  subscribeMyFoundItemsForDriver,
  subscribeOpenLostReports,
} from "@/data/lostFound";
import { getCurrentUserProfile } from "@/data/users"; // you already have this
import type { LostFoundDoc } from "@/types/lostFound";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const DAY_MS = 24 * 60 * 60 * 1000;

const TabButton = ({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    className={`px-4 py-2 rounded-full ${active ? "bg-blue-600" : "bg-gray-200"}`}
  >
    <Text
      className={`${active ? "text-white" : "text-gray-700"} font-semibold`}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

const Badge = ({
  text,
  tone = "gray",
}: {
  text: string;
  tone?: "green" | "blue" | "gray" | "red";
}) => {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
  };
  return (
    <View className={`px-3 py-1 rounded-full ${map[tone]}`}>
      <Text className="text-xs font-semibold">{text}</Text>
    </View>
  );
};

const SkeletonRow = () => (
  <View className="bg-white rounded-2xl p-4 w-full shadow mb-3">
    <View className="flex-row items-center gap-3">
      <View className="w-12 h-12 bg-gray-200/60 rounded-lg" />
      <View className="flex-1">
        <View className="h-4 bg-gray-200/60 rounded mb-2 w-2/3" />
        <View className="h-3 bg-gray-200/60 rounded w-1/3" />
      </View>
    </View>
    <View className="h-3 bg-gray-200/60 rounded mt-3 w-11/12" />
  </View>
);

const EmptyState = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
  <View className="w-full items-center justify-center py-10">
    <Text className="text-3xl mb-2">🗂️</Text>
    <Text className="text-lg font-medium text-gray-800">{title}</Text>
    {subtitle ? <Text className="text-gray-500 mt-1">{subtitle}</Text> : null}
  </View>
);

const DriverLostManagerScreen = () => {
  const [activeTab, setActiveTab] = useState<"reports" | "post" | "mine">(
    "reports"
  );

  const [driverBusId, setDriverBusId] = useState<string | null>(null);
  const [driverBusNumber, setDriverBusNumber] = useState<string | null>(null);

  // Lists
  const [loadingReports, setLoadingReports] = useState(true);
  const [reports, setReports] = useState<LostFoundDoc[]>([]); // parents' LOST (OPEN)
  const [loadingMine, setLoadingMine] = useState(true);
  const [myFound, setMyFound] = useState<LostFoundDoc[]>([]);

  // Per-item action spinner
  const [actionId, setActionId] = useState<string | null>(null);

  // Post found form
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Modal to preview a report
  const [viewItem, setViewItem] = useState<LostFoundDoc | null>(null);

  // Load driver profile (to know bus)
  useEffect(() => {
    (async () => {
      const me = await getCurrentUserProfile();
      // Assuming you store driver's assigned bus in currentBusId and maybe busNumber on user:
      setDriverBusId((me as any)?.currentBusId ?? null);
      setDriverBusNumber((me as any)?.busNumber ?? null);
    })();
  }, []);

  // Subscribe to parent LOST reports (OPEN). If you store busId on lost docs, pass it to filter.
  useEffect(() => {
    setLoadingReports(true);
    // If your LOST docs include busId, do: subscribeOpenLostReports(setReports, { busId: driverBusId ?? undefined });
    const unsub = subscribeOpenLostReports((rows) => {
      setReports(rows);
      setLoadingReports(false);
    });
    return () => unsub();
  }, [driverBusId]);

  // Subscribe to my FOUND posts
  useEffect(() => {
    setLoadingMine(true);
    const unsub = subscribeMyFoundItemsForDriver((rows) => {
      setMyFound(rows);
      setLoadingMine(false);
    });
    return () => unsub();
  }, []);

  // Actions on parent reports
  async function onClaim(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await claimLostReport(id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to claim");
    } finally {
      setActionId(null);
    }
  }
  async function onResolve(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await resolveLostReport(id); // sets RESOLVED + ttlAt(24h)
    } catch (e: any) {
      alert(e?.message ?? "Failed to mark resolved");
    } finally {
      setActionId(null);
    }
  }

  // Actions on my found
  async function onMarkReturned(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await markFoundAsReturned(id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to mark returned");
    } finally {
      setActionId(null);
    }
  }
  async function onRemoveFound(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await deleteItem(id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove");
    } finally {
      setActionId(null);
    }
  }

  // Post found
  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets?.length) {
      setPhotoUri(res.assets[0].uri);
    }
  }
  async function postFound() {
    if (submitting) return;
    if (!title.trim() || !desc.trim()) {
      alert("Please fill in all fields");
      return;
    }
    if (!driverBusId) {
      alert("No bus assigned to driver profile.");
      return;
    }
    try {
      setSubmitting(true);
      await createFoundItem({
        title: title.trim(),
        description: desc.trim(),
        photoUri,
        busId: driverBusId,
        busNumber: driverBusNumber ?? undefined,
      });
      setTitle("");
      setDesc("");
      setPhotoUri(null);
      setActiveTab("mine");
    } catch (e: any) {
      alert(e?.message ?? "Failed to post");
    } finally {
      setSubmitting(false);
    }
  }

  // UI helpers
  const headerRight = useMemo(
    () =>
      driverBusNumber
        ? `Bus ${driverBusNumber}`
        : driverBusId
          ? `Bus: ${driverBusId}`
          : "No bus",
    [driverBusId, driverBusNumber]
  );

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />

      <View className="px-5">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-semibold mt-2 tracking-tight">
            Driver – Lost &amp; Found
          </Text>
          <Text className="text-gray-500 mt-2">{headerRight}</Text>
        </View>

        {/* Tabs */}
        <View className="flex-row gap-2 mt-4">
          <TabButton
            label="Parent Reports"
            active={activeTab === "reports"}
            onPress={() => setActiveTab("reports")}
          />
          <TabButton
            label="Post Found"
            active={activeTab === "post"}
            onPress={() => setActiveTab("post")}
          />
          <TabButton
            label="My Found Posts"
            active={activeTab === "mine"}
            onPress={() => setActiveTab("mine")}
          />
        </View>
      </View>

      {activeTab === "reports" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
        >
          {loadingReports ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : reports.length === 0 ? (
            <EmptyState
              title="No parent reports"
              subtitle="Parents’ LOST reports will appear here."
            />
          ) : (
            reports.map((it) => {
              const working = actionId === it.id;
              return (
                <View
                  key={it.id}
                  className="bg-white rounded-2xl p-4 w-full shadow mb-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start gap-3">
                      <Image
                        source={it.photoUrl ? { uri: it.photoUrl } : icons.lost}
                        className="w-12 h-12 rounded-lg"
                        resizeMode="cover"
                      />
                      <View>
                        <Text className="text-base font-semibold">
                          {it.title}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {it.createdAt?.toDate
                            ? it.createdAt.toDate().toLocaleString()
                            : ""}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      text={it.status}
                      tone={it.status === "OPEN" ? "green" : "blue"}
                    />
                  </View>

                  <Text className="text-gray-700 text-sm leading-5 mt-2">
                    {it.description}
                  </Text>

                  <View className="flex-row gap-2 mt-3 justify-end">
                    <TouchableOpacity
                      onPress={() => setViewItem(it)}
                      activeOpacity={0.85}
                    >
                      <Text className="py-2 px-5 bg-gray-800 rounded-lg text-white">
                        View
                      </Text>
                    </TouchableOpacity>
                    {it.status === "OPEN" && (
                      <TouchableOpacity
                        onPress={() => onClaim(it.id)}
                        disabled={working}
                        activeOpacity={0.85}
                      >
                        <View
                          className={`py-2 px-5 rounded-lg ${working ? "bg-blue-600/70" : "bg-blue-600"}`}
                        >
                          {working ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white">Claim</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      onPress={() => onResolve(it.id)}
                      disabled={working}
                      activeOpacity={0.85}
                    >
                      <View
                        className={`py-2 px-5 rounded-lg ${working ? "bg-green-600/70" : "bg-green-600"}`}
                      >
                        {working ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white">Mark Resolved</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {activeTab === "post" && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 20 }}
          >
            <Text className="text-xl font-medium mb-2">Post a Found Item</Text>
            <TouchableOpacity
              onPress={pickPhoto}
              disabled={submitting}
              className={`w-full h-48 mt-2 items-center justify-center rounded-xl overflow-hidden ${photoUri ? "" : "bg-gray-100"}`}
              activeOpacity={0.85}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="w-full h-full" />
              ) : (
                <>
                  <Text className="text-gray-500 text-2xl">📷</Text>
                  <Text className="text-gray-500 text-sm mt-2">Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <Text className="text-base font-medium mt-5 mb-2">Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              className="w-full border border-gray-300 rounded-lg p-3"
              placeholder="e.g., Blue Bottle"
              editable={!submitting}
            />

            <Text className="text-base font-medium mt-4 mb-2">
              Description *
            </Text>
            <TextInput
              value={desc}
              onChangeText={setDesc}
              className="w-full border border-gray-300 rounded-lg p-3 h-28"
              placeholder="Where/when you found it"
              multiline
              textAlignVertical="top"
              editable={!submitting}
            />

            <TouchableOpacity
              className={`mt-6 py-3 rounded-lg ${submitting ? "bg-blue-500/70" : "bg-blue-600"}`}
              onPress={postFound}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Post Found
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {activeTab === "mine" && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 28 }}
        >
          {loadingMine ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : myFound.length === 0 ? (
            <EmptyState
              title="No found posts yet"
              subtitle="Items you post appear here until returned."
            />
          ) : (
            myFound.map((it) => {
              const working = actionId === it.id;
              const resolved = it.status === "RESOLVED";
              const left =
                resolved && it.resolvedAt?.toDate
                  ? Math.max(
                      0,
                      DAY_MS - (Date.now() - it.resolvedAt.toDate().getTime())
                    )
                  : null;
              const leftText =
                left != null
                  ? `${Math.floor(left / 3600000)}h ${Math.floor((left % 3600000) / 60000)}m`
                  : null;

              return (
                <View
                  key={it.id}
                  className="bg-white rounded-2xl p-4 w-full shadow mb-3"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start gap-3">
                      <Image
                        source={it.photoUrl ? { uri: it.photoUrl } : icons.lost}
                        className="w-12 h-12 rounded-lg"
                        resizeMode="cover"
                      />
                      <View>
                        <Text className="text-base font-semibold">
                          {it.title}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {it.createdAt?.toDate
                            ? it.createdAt.toDate().toLocaleString()
                            : ""}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      text={resolved ? "Returned" : "Open"}
                      tone={resolved ? "gray" : "blue"}
                    />
                  </View>

                  <Text className="text-gray-700 text-sm leading-5 mt-2">
                    {it.description}
                  </Text>
                  {resolved && leftText ? (
                    <Text className="text-gray-500 text-xs mt-1">
                      Auto-removes in {leftText}
                    </Text>
                  ) : null}

                  <View className="flex-row gap-2 mt-3 justify-end">
                    {!resolved ? (
                      <TouchableOpacity
                        onPress={() => onMarkReturned(it.id)}
                        disabled={working}
                        activeOpacity={0.85}
                      >
                        <View
                          className={`py-2 px-5 rounded-lg ${working ? "bg-green-600/70" : "bg-green-600"}`}
                        >
                          {working ? (
                            <ActivityIndicator color="#fff" />
                          ) : (
                            <Text className="text-white">Mark Returned</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => onRemoveFound(it.id)}
                      disabled={working}
                      activeOpacity={0.85}
                    >
                      <View
                        className={`py-2 px-5 rounded-lg ${working ? "bg-red-600/70" : "bg-red-600"}`}
                      >
                        {working ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text className="text-white">Remove</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Preview modal for a report */}
      <Modal
        animationType="fade"
        transparent
        visible={!!viewItem}
        onRequestClose={() => setViewItem(null)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            {viewItem ? (
              <>
                <Image
                  source={
                    viewItem.photoUrl ? { uri: viewItem.photoUrl } : icons.lost
                  }
                  className="w-full h-64"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-semibold">
                      {viewItem.title}
                    </Text>
                    <Badge text={viewItem.status} tone="blue" />
                  </View>
                  <Text className="text-gray-500 mt-1">
                    {viewItem.createdAt?.toDate
                      ? viewItem.createdAt.toDate().toLocaleString()
                      : ""}
                  </Text>
                  <Text className="text-gray-800 mt-3 leading-5">
                    {viewItem.description}
                  </Text>
                  <View className="flex-row gap-3 mt-4">
                    {/* Placeholder for contacting parent — wire to your chat if you have it */}
                    <TouchableOpacity
                      className="flex-1 bg-gray-800 py-3 rounded-lg"
                      onPress={() => setViewItem(null)}
                    >
                      <Text className="text-white text-center font-semibold">
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default DriverLostManagerScreen;
