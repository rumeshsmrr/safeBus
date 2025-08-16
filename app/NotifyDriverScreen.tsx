// app/NotifyDriverScreen.tsx
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import DateTimePicker from "@react-native-community/datetimepicker";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Header2 from "./Components/header2";

import {
  dateKeyFor,
  ensureTourDay,
  setBothSessionsNotGoing,
} from "@/data/tours";
import { subscribeMyChildren } from "@/data/users";
import type { UserDoc } from "@/types/user";

const scrollViewBottomPadding = 24;

type SentMessage = {
  id: string;
  message: string;
  date: Date;
  childUid: string;
  childName: string;
  childImage: any;
};

const DEFAULT_MESSAGES = [{ id: "notgoing", message: "Not available" }];

const NotifyDriverScreen = () => {
  // children from DB
  const [children, setChildren] = useState<UserDoc[] | null>(null);
  const [loadingKids, setLoadingKids] = useState(true);

  // selection state
  const [selectedChildUid, setSelectedChildUid] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(
    DEFAULT_MESSAGES[0].message
  );

  // date picker state
  const [date, setDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // UX state
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<SentMessage[]>([]);

  // dates bounds
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const oneYearFromNow = useMemo(() => {
    const d = new Date(today);
    d.setFullYear(today.getFullYear() + 1);
    return d;
  }, [today]);

  // subscribe to current parent's children
  useEffect(() => {
    const unsub = subscribeMyChildren((kids) => {
      setChildren(kids);
      setLoadingKids(false);
      if (kids.length && !selectedChildUid) setSelectedChildUid(kids[0].uid);
    });
    if (!unsub) setLoadingKids(false);
    return () => unsub?.();
  }, []);

  const selectedChild = useMemo(
    () => children?.find((c) => c.uid === selectedChildUid) ?? null,
    [children, selectedChildUid]
  );

  const selectedChildName = useMemo(() => {
    if (!selectedChild) return "";
    return (
      selectedChild.fullName ||
      [selectedChild.firstName, selectedChild.lastName]
        .filter(Boolean)
        .join(" ") ||
      "Unnamed"
    );
  }, [selectedChild]);

  const canSend =
    !!date &&
    !!selectedMessage &&
    !!selectedChild?.currentBusId &&
    !!selectedChild?.uid;

  const onChangeDate = (_: any, picked?: Date) => {
    setShowPicker(Platform.OS === "ios"); // keep iOS picker open, Android closes itself
    if (picked) {
      picked.setHours(0, 0, 0, 0);
      setDate(picked);
    }
  };

  const handleSend = async () => {
    if (!canSend || !selectedChild || !date) {
      Alert.alert("Select all fields", "Pick child, date and message.");
      return;
    }
    const busId = selectedChild.currentBusId!;
    const childUid = selectedChild.uid;
    const dateKey = dateKeyFor(date);

    try {
      setSending(true);
      // Make sure the tour day exists & the participant snapshot is refreshed
      await ensureTourDay(busId, dateKey);
      // Mark NOT_GOING for both sessions for that date
      await setBothSessionsNotGoing(busId, childUid, dateKey);

      // (optional) local “sent” list for parent UI
      setSentMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          message: selectedMessage!,
          date,
          childUid,
          childName: selectedChildName,
          childImage: images.childImage1,
        },
      ]);
      setDate(null);
      // keep selectedMessage as-is; parent often repeats the same note

      Alert.alert(
        "Sent",
        `Marked "${selectedChildName}" as NOT GOING for morning & evening on ${date.toLocaleDateString()}. The driver’s tour will update.`
      );
    } catch (e: any) {
      Alert.alert("Couldn’t send", e?.message ?? "Please try again.");
    } finally {
      setSending(false);
    }
  };

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
        <Text className="text-2xl font-light mt-4">Notify Driver</Text>

        {/* Children list */}
        <Text className="text-xl font-light mt-4">Connected Child</Text>
        {loadingKids ? (
          <View className="mt-4 items-center">
            <ActivityIndicator />
            <Text className="text-neutral-500 mt-2">Loading…</Text>
          </View>
        ) : !children || children.length === 0 ? (
          <Text className="text-neutral-500 mt-4">
            No children linked to your account.
          </Text>
        ) : (
          <View className="flex-col gap-2 pt-4">
            {children.map((child) => {
              const name =
                child.fullName ||
                [child.firstName, child.lastName].filter(Boolean).join(" ") ||
                "Unnamed";
              const isLinked = !!child.currentBusId;

              return (
                <TouchableOpacity
                  key={child.uid}
                  className={`flex-col gap-4 bg-white p-4 rounded-lg shadow ${
                    selectedChildUid === child.uid ? "border border-black" : ""
                  }`}
                  onPress={() => setSelectedChildUid(child.uid)}
                >
                  <View>
                    <View className="flex-row items-center gap-4">
                      <Image
                        source={images.childImage1}
                        style={{ height: 48, width: 48, borderRadius: 24 }}
                      />
                      <View className="flex-1">
                        <Text
                          className="text-lg font-semibold"
                          numberOfLines={1}
                        >
                          {name}
                        </Text>
                        <Text
                          className={`text-sm font-light ${
                            isLinked ? "text-blue-700" : "text-rose-600"
                          }`}
                          numberOfLines={1}
                        >
                          {isLinked ? "Linked to Bus" : "Not Linked to Bus"}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-col gap-2 border-t border-gray-200 pt-2">
                      <Text className="text-md text-grayText">Home:</Text>
                      <View className="flex-row items-center justify-between gap-2">
                        <View className="flex-row gap-2 flex-1">
                          <Image
                            source={icons.homeLocationIcon}
                            style={{ height: 16, width: 16 }}
                          />
                          <Text
                            className="text-sm text-grayText flex-1"
                            numberOfLines={2}
                          >
                            {(child as any)?.homeLocation?.address ?? "—"}
                          </Text>
                        </View>
                        <View className="flex-row gap-2">
                          <Text className="text-grayText">
                            {typeof (child as any)?.homeLocation?.latitude ===
                            "number"
                              ? `${(child as any).homeLocation.latitude.toFixed(4)}°`
                              : "—"}
                          </Text>
                          <Text className="text-grayText">
                            {typeof (child as any)?.homeLocation?.longitude ===
                            "number"
                              ? `${(child as any).homeLocation.longitude.toFixed(4)}°`
                              : "—"}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-md text-grayText">School:</Text>
                      <View className="flex-row items-center justify-between gap-2">
                        <View className="flex-row gap-2 flex-1">
                          <Image
                            source={icons.schoolLocationIcon}
                            style={{ height: 16, width: 16 }}
                          />
                          <Text
                            className="text-sm text-grayText flex-1"
                            numberOfLines={2}
                          >
                            {(child as any)?.schoolLocation?.address ?? "—"}
                          </Text>
                        </View>
                        <View className="flex-row gap-2">
                          <Text className="text-grayText">
                            {typeof (child as any)?.schoolLocation?.latitude ===
                            "number"
                              ? `${(child as any).schoolLocation.latitude.toFixed(4)}°`
                              : "—"}
                          </Text>
                          <Text className="text-grayText">
                            {typeof (child as any)?.schoolLocation
                              ?.longitude === "number"
                              ? `${(child as any).schoolLocation.longitude.toFixed(4)}°`
                              : "—"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Date Picker */}
        <View className="mt-6">
          <Text className="text-lg font-normal mb-2">Choose Date</Text>
          <TouchableOpacity
            onPress={() => setShowPicker(true)}
            className="bg-white p-4 rounded-full shadow justify-between flex-row items-center"
            style={{ height: 60 }}
          >
            <Text className="text-base text-grayText">
              {date ? date.toLocaleDateString() : "Choose Date"}
            </Text>
            <Image source={icons.calender} style={{ height: 24, width: 24 }} />
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date || today}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onChangeDate}
              minimumDate={today}
              maximumDate={oneYearFromNow}
            />
          )}

          <Text className="text-lg font-normal mb-2 mt-3">Message</Text>
          <View className="flex-row gap-2 flex-wrap">
            {DEFAULT_MESSAGES.map((m) => (
              <TouchableOpacity
                key={m.id}
                className="bg-bluesh px-4 py-3 rounded-full shadow"
                onPress={() => setSelectedMessage(m.message)}
                style={{
                  borderColor:
                    selectedMessage === m.message ? "black" : "transparent",
                  borderWidth: selectedMessage === m.message ? 1 : 0,
                }}
              >
                <Text className="text-base text-grayText text-center">
                  {m.message}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <TouchableOpacity
          disabled={!canSend || sending}
          className={`p-4 rounded-full shadow mt-6 ${
            canSend && !sending ? "bg-blue-500" : "bg-neutral-300"
          }`}
          onPress={handleSend}
        >
          {sending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base text-white text-center">
              Send Message
            </Text>
          )}
        </TouchableOpacity>

        {/* Local sent log for the parent’s view */}
        {sentMessages.length > 0 && (
          <>
            <Text className="text-2xl font-light mt-6">Sent Messages</Text>
            <View className="flex-col gap-4 mt-4">
              {sentMessages.map((m) => {
                const d = m.date instanceof Date ? m.date : new Date(m.date);
                return (
                  <View
                    key={m.id}
                    className="flex-row items-center gap-4 bg-white p-4 rounded-lg shadow"
                  >
                    <Image
                      source={m.childImage}
                      style={{ height: 48, width: 48, borderRadius: 24 }}
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-lg font-semibold flex-shrink">
                          {m.childName}
                        </Text>
                        <Text className="text-xs text-grayText text-right ml-2">
                          {d.toLocaleDateString()}{" "}
                          {d.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      </View>
                      <Text className="text-sm text-grayText mt-1">
                        {m.message}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default NotifyDriverScreen;
