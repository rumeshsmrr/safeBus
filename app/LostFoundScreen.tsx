// app/LostFoundScreen.tsx
import {
  createLostItem,
  deleteMyLostItem,
  editLostItem,
  markLostAsFound,
  subscribeFoundItemsByBus,
  subscribeMyLostItems,
} from "@/data/lostFound";
import { subscribeMyChildren } from "@/data/users";
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
import Header2 from "./Components/header2";

const scrollViewBottomPadding = 24;
const DAY_MS = 24 * 60 * 60 * 1000;

const SkeletonBox = ({ w = 96, h = 96 }: { w?: number; h?: number }) => (
  <View
    className="bg-gray-200/60 rounded-xl overflow-hidden"
    style={{ width: w, height: h }}
  />
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

const Badge = ({
  text,
  tone = "green",
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

const LostFoundScreen = () => {
  const [busId, setBusId] = useState<string | null>(null);

  // Realtime lists
  const [foundItems, setFoundItems] = useState<LostFoundDoc[]>([]);
  const [myLostItems, setMyLostItems] = useState<LostFoundDoc[]>([]);

  // Loading states
  const [loadingFound, setLoadingFound] = useState(true);
  const [loadingMyLost, setLoadingMyLost] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null); // per-item action spinner

  // UI states
  const [selectedItem, setSelectedItem] = useState<LostFoundDoc | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModeVisible, setEditModeVisible] = useState(false);

  // Edit form
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // Add new lost
  const [addModeVisible, setAddModeVisible] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPhotoUri, setNewPhotoUri] = useState<string | null>(null);

  // 1) Find a busId from my children
  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => {
      const firstWithBus = kids.find((k) => (k as any).currentBusId);
      setBusId(firstWithBus ? (firstWithBus as any).currentBusId : null);
    });
    return () => {
      unsub?.();
    };
  }, []);

  // 2) Subscribe FOUND by bus
  useEffect(() => {
    if (!busId) {
      setFoundItems([]);
      setLoadingFound(false);
      return;
    }
    setLoadingFound(true);
    const unsub = subscribeFoundItemsByBus(busId, (rows) => {
      setFoundItems(rows);
      setLoadingFound(false);
    });
    return () => unsub();
  }, [busId]);

  // 3) Subscribe my LOST
  useEffect(() => {
    setLoadingMyLost(true);
    const unsub = subscribeMyLostItems((rows) => {
      setMyLostItems(rows);
      setLoadingMyLost(false);
    });
    return () => unsub();
  }, []);

  // Hide RESOLVED after 24h (client side)
  const visibleMyLost = useMemo(() => {
    const now = Date.now();
    return myLostItems.filter((it) => {
      if (it.status !== "RESOLVED") return true;
      const at = it.resolvedAt?.toDate ? it.resolvedAt.toDate().getTime() : 0;
      return now - at < DAY_MS;
    });
  }, [myLostItems]);

  function timeLeftText(item: LostFoundDoc) {
    if (item.status !== "RESOLVED" || !item.resolvedAt?.toDate) return null;
    const ms = DAY_MS - (Date.now() - item.resolvedAt.toDate().getTime());
    if (ms <= 0) return "removing soon";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  // Handlers
  const handleItemPress = (item: LostFoundDoc) => {
    setSelectedItem(item);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const handleEditModePress = (item: LostFoundDoc) => {
    setSelectedItem(item);
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditModeVisible(true);
  };
  const closeEditMode = () => {
    setEditModeVisible(false);
    setSelectedItem(null);
    setEditTitle("");
    setEditDescription("");
  };
  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    await editLostItem(selectedItem.id, {
      title: editTitle,
      description: editDescription,
    });
    closeEditMode();
  };

  const handleReportLost = () => setAddModeVisible(true);
  const closeAddMode = () => {
    if (submitting) return;
    setAddModeVisible(false);
    setNewTitle("");
    setNewDescription("");
    setNewPhotoUri(null);
  };

  async function addLost() {
    if (submitting) return;
    if (!newTitle.trim() || !newDescription.trim()) {
      alert("Please fill in all fields");
      return;
    }
    try {
      setSubmitting(true);
      await createLostItem({
        title: newTitle.trim(),
        description: newDescription.trim(),
        photoUri: newPhotoUri ?? undefined,
      });
      closeAddMode();
    } catch (e: any) {
      alert(e?.message ?? "Failed to report item");
    } finally {
      setSubmitting(false);
    }
  }

  async function pickPhoto() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
    });
    if (!res.canceled && res.assets?.length) {
      setNewPhotoUri(res.assets[0].uri);
    }
  }

  // Item actions
  async function onMarkFound(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await markLostAsFound(id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to mark as found");
    } finally {
      setActionId(null);
    }
  }
  async function onRemoveNow(id: string) {
    if (actionId) return;
    try {
      setActionId(id);
      await deleteMyLostItem(id);
    } catch (e: any) {
      alert(e?.message ?? "Failed to remove");
    } finally {
      setActionId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-light-100 py-9">
      <Header2 />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: scrollViewBottomPadding,
        }}
      >
        <Text className="text-2xl font-semibold mt-2 tracking-tight">
          Lost &amp; Found
        </Text>

        {/* FOUND by bus */}
        <View className="mt-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-medium">
              Found Items {busId ? "" : "(select a child to see bus items)"}
            </Text>
            {loadingFound ? <ActivityIndicator /> : null}
          </View>

          <View className="flex-row flex-wrap gap-3 mt-4">
            {loadingFound ? (
              Array.from({ length: 6 }).map((_, i) => (
                <SkeletonBox key={`sk-f-${i}`} />
              ))
            ) : foundItems.length === 0 ? (
              <EmptyState
                title="No found items yet"
                subtitle="We’ll show items from your child’s bus here."
              />
            ) : (
              foundItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.8}
                >
                  <View className="w-24 h-24 rounded-xl overflow-hidden bg-white shadow">
                    <Image
                      source={
                        item.photoUrl
                          ? { uri: item.photoUrl }
                          : require("../assets/images/lostItem1.jpeg")
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                    <View className="absolute top-1 right-1">
                      <Badge text="Found" tone="blue" />
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* MY LOST */}
        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-medium">Your Lost Items</Text>
            {loadingMyLost ? <ActivityIndicator /> : null}
          </View>

          {loadingMyLost ? (
            <View className="mt-4 flex-row flex-wrap gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <View
                  key={`sk-l-${i}`}
                  className="bg-white rounded-2xl p-4 w-full shadow"
                >
                  <View className="flex-row items-center gap-3">
                    <SkeletonBox w={48} h={48} />
                    <View className="flex-1">
                      <View className="h-4 bg-gray-200/60 rounded mb-2" />
                      <View className="h-3 bg-gray-200/60 rounded w-2/3" />
                    </View>
                  </View>
                  <View className="h-3 bg-gray-200/60 rounded mt-4" />
                  <View className="h-3 bg-gray-200/60 rounded mt-2 w-11/12" />
                </View>
              ))}
            </View>
          ) : visibleMyLost.length === 0 ? (
            <EmptyState
              title="You haven’t reported anything"
              subtitle="Tap ‘Report Lost Item’ to create one."
            />
          ) : (
            <View className="flex-row flex-wrap gap-2 mt-4">
              {visibleMyLost.map((item) => {
                const isResolved = item.status === "RESOLVED";
                const left = timeLeftText(item);
                const loadingThis = actionId === item.id;

                return (
                  <View
                    key={item.id}
                    className="flex-col gap-2 bg-white rounded-2xl mb-4 p-4 w-full shadow"
                  >
                    <View className="w-full flex-row justify-between items-start">
                      <View className="flex-row items-start justify-start gap-3">
                        <Image
                          source={
                            item.photoUrl
                              ? { uri: item.photoUrl }
                              : require("../assets/images/lostItem1.jpeg")
                          }
                          className="w-12 h-12 rounded-lg"
                          resizeMode="cover"
                        />
                        <View className="flex-col gap-1">
                          <Text className="text-base font-semibold">
                            {item.title}
                          </Text>
                          <Text className="text-gray-500 text-sm">
                            {item.createdAt?.toDate
                              ? item.createdAt
                                  .toDate()
                                  .toISOString()
                                  .split("T")[0]
                              : ""}
                          </Text>
                        </View>
                      </View>
                      <Badge
                        text={isResolved ? "Found" : item.status}
                        tone={isResolved ? "gray" : "green"}
                      />
                    </View>

                    <Text className="text-gray-700 text-sm leading-5">
                      {item.description}
                    </Text>
                    {isResolved && left ? (
                      <Text className="text-gray-500 text-xs">
                        Auto-removes in {left}
                      </Text>
                    ) : null}

                    <View className="w-full flex-row justify-end gap-2 mt-2">
                      {!isResolved ? (
                        <>
                          <TouchableOpacity
                            onPress={() => handleEditModePress(item)}
                            activeOpacity={0.8}
                          >
                            <Text className="py-2 px-5 bg-gray-800 rounded-lg text-white">
                              Edit
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onMarkFound(item.id)}
                            disabled={loadingThis}
                            activeOpacity={0.8}
                          >
                            <View
                              className={`py-2 px-5 rounded-lg ${loadingThis ? "bg-green-600/70" : "bg-green-600"}`}
                            >
                              {loadingThis ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text className="text-white">
                                  Mark as Found
                                </Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => onRemoveNow(item.id)}
                            disabled={loadingThis}
                            activeOpacity={0.8}
                          >
                            <View
                              className={`py-2 px-5 rounded-lg ${loadingThis ? "bg-red-600/70" : "bg-red-600"}`}
                            >
                              {loadingThis ? (
                                <ActivityIndicator color="#fff" />
                              ) : (
                                <Text className="text-white">Remove</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <TouchableOpacity
                          onPress={() => onRemoveNow(item.id)}
                          disabled={loadingThis}
                          activeOpacity={0.8}
                        >
                          <View
                            className={`py-2 px-5 rounded-lg ${loadingThis ? "bg-red-600/70" : "bg-red-600"}`}
                          >
                            {loadingThis ? (
                              <ActivityIndicator color="#fff" />
                            ) : (
                              <Text className="text-white">Remove now</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <TouchableOpacity
          className="bg-blue-600 py-3 rounded-xl mb-6 mt-2 shadow"
          onPress={handleReportLost}
          activeOpacity={0.8}
        >
          <Text className="text-white text-center font-semibold">
            Report Lost Item
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* View details modal */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-4">
          <View className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            {selectedItem ? (
              <>
                <Image
                  source={
                    selectedItem.photoUrl
                      ? { uri: selectedItem.photoUrl }
                      : require("../assets/images/lostItem1.jpeg")
                  }
                  className="w-full h-64"
                  resizeMode="cover"
                />
                <View className="p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xl font-semibold">
                      {selectedItem.title}
                    </Text>
                    <Badge text={selectedItem.status} tone="blue" />
                  </View>
                  <Text className="text-gray-500 mt-1">
                    {selectedItem.createdAt?.toDate
                      ? selectedItem.createdAt.toDate().toLocaleString()
                      : ""}
                  </Text>
                  <Text className="text-gray-800 mt-3 leading-5">
                    {selectedItem.description}
                  </Text>
                  <View className="flex-row gap-3 mt-4">
                    <TouchableOpacity
                      className="flex-1 bg-gray-800 py-3 rounded-lg"
                      onPress={closeModal}
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

      {/* Add Lost modal */}
      <Modal
        animationType="slide"
        transparent
        visible={addModeVisible}
        onRequestClose={closeAddMode}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center bg-black/50"
        >
          <View className="bg-white rounded-2xl max-w-sm w-full shadow-lg">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-2xl font-semibold text-center">
                Report Lost Item
              </Text>
            </View>

            <TouchableOpacity
              onPress={pickPhoto}
              disabled={submitting}
              className={`w-full h-48 mt-4 items-center justify-center rounded-xl overflow-hidden mx-4 ${
                newPhotoUri ? "" : "bg-gray-100"
              }`}
              activeOpacity={0.8}
            >
              {newPhotoUri ? (
                <Image
                  source={{ uri: newPhotoUri }}
                  className="w-full h-full"
                />
              ) : (
                <>
                  <Text className="text-gray-500 text-2xl">📷</Text>
                  <Text className="text-gray-500 text-sm mt-2">Add Photo</Text>
                </>
              )}
            </TouchableOpacity>

            <View className="flex-col items-start p-4">
              <Text className="text-base font-medium mb-2">Item Title *</Text>
              <TextInput
                value={newTitle}
                onChangeText={setNewTitle}
                className="w-full border border-gray-300 rounded-lg p-3 mb-3"
                placeholder="e.g., Blue Backpack, iPhone, Keys..."
                editable={!submitting}
              />
              <Text className="text-base font-medium mb-2">Description *</Text>
              <TextInput
                value={newDescription}
                onChangeText={setNewDescription}
                className="w-full border border-gray-300 rounded-lg p-3 h-28"
                placeholder="Describe your lost item"
                multiline
                textAlignVertical="top"
                editable={!submitting}
              />
              <Text className="text-gray-600 text-xs mt-3">
                Date: {new Date().toISOString().split("T")[0]}
              </Text>
            </View>

            <View className="flex-row gap-3 p-4">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg ${submitting ? "bg-blue-500/70" : "bg-blue-600"}`}
                onPress={addLost}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-center font-semibold">
                    Report Lost
                  </Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-500 py-3 rounded-lg"
                onPress={closeAddMode}
                disabled={submitting}
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Edit Lost modal */}
      <Modal
        animationType="fade"
        transparent
        visible={editModeVisible}
        onRequestClose={closeEditMode}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center bg-black/50 p-4"
        >
          <View className="bg-white rounded-2xl w-full max-w-md p-4">
            <Text className="text-xl font-semibold mb-3">Edit Lost Item</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-3"
              value={editTitle}
              onChangeText={setEditTitle}
              placeholder="Title"
            />
            <TextInput
              className="border border-gray-300 rounded-lg p-3 h-28"
              value={editDescription}
              onChangeText={setEditDescription}
              placeholder="Description"
              multiline
              textAlignVertical="top"
            />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                className="flex-1 bg-blue-600 py-3 rounded-lg"
                onPress={handleSaveEdit}
              >
                <Text className="text-white text-center font-semibold">
                  Save
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-gray-500 py-3 rounded-lg"
                onPress={closeEditMode}
              >
                <Text className="text-white text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

export default LostFoundScreen;
