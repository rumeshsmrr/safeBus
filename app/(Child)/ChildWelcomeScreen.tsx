// app/ParentWelcomeScreen.tsx  (student welcome)
import { images } from "@/constants/images";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ALERT_TYPE, Dialog } from "react-native-alert-notification";
import { SafeAreaView } from "react-native-safe-area-context";

// 🔥 Firebase
import { auth, db } from "@/app/lib/firebase";
import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

type ParentPreview = {
  uid: string;
  fullName?: string | null;
  email?: string | null;
  parentCode: string;
};

const ChildWelcomeScreen: React.FC = () => {
  const [inputCode, setInputCode] = useState(["", "", "", "", "", ""]);
  const [fullInputCode, setFullInputCode] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const [checking, setChecking] = useState(false);
  const [foundParent, setFoundParent] = useState<ParentPreview | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  // ---------- Code input handlers ----------
  const handleInputChange = (text: string, index: number) => {
    if (!/^\d?$/.test(text)) return; // only digits, max 1 char

    const next = [...inputCode];
    next[index] = text;
    setInputCode(next);

    const joined = next.join("");
    setFullInputCode(joined);

    // auto-focus next when typing
    if (text && index < inputCode.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: { nativeEvent: { key: string } },
    index: number
  ) => {
    if (e.nativeEvent.key === "Backspace" && !inputCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resetCodeInputs = () => {
    setInputCode(["", "", "", "", "", ""]);
    setFullInputCode("");
    inputRefs.current[0]?.focus?.();
  };

  // ---------- Firestore lookup ----------
  const lookupParentByCode = async (
    code: string
  ): Promise<ParentPreview | null> => {
    // Keep it simple: query only by parentCode (no composite index needed)
    const q = query(
      collection(db, "users"),
      where("parentCode", "==", code),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docSnap = snap.docs[0];
    const data = docSnap.data() || {};
    return {
      uid: docSnap.id,
      fullName:
        (data.fullName as string) ??
        `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim(),
      email: data.email as string,
      parentCode: code,
    };
  };

  const onContinuePress = async () => {
    if (fullInputCode.length !== 6) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Invalid code",
        textBody: "Please enter the 6-digit code.",
        button: "close",
      });
      return;
    }

    try {
      setChecking(true);
      const parent = await lookupParentByCode(fullInputCode);
      if (!parent) {
        Dialog.show({
          type: ALERT_TYPE.DANGER,
          title: "Not found",
          textBody:
            "No parent was found for that code. Please check and try again.",
          button: "close",
        });
        return;
      }

      setFoundParent(parent);
      setConfirmVisible(true);
    } catch (e: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Error",
        textBody: e?.message || "Failed to verify code. Please try again.",
        button: "close",
      });
    } finally {
      setChecking(false);
    }
  };

  const onConfirmLink = async () => {
    try {
      const childUid = auth.currentUser?.uid || null;
      if (childUid && foundParent) {
        // Link child to this parent. Minimal write on the child's user doc.
        await setDoc(
          doc(db, "users", childUid),
          {
            uid: childUid,
            role: "student",
            parentUid: foundParent.uid,
            parentCode: foundParent.parentCode,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      setConfirmVisible(false);
      router.replace("/(Child)/(tabs)/child_home");
    } catch (e: any) {
      Dialog.show({
        type: ALERT_TYPE.DANGER,
        title: "Link failed",
        textBody: e?.message || "Could not complete linking. Please try again.",
        button: "close",
      });
    }
  };

  const onCancelConfirm = () => {
    setConfirmVisible(false);
    // Allow another try; you can also clear the code if you prefer:
    // resetCodeInputs();
    setFoundParent(null);
    setInputCode(["", "", "", "", "", ""]);
  };

  return (
    <SafeAreaView className="flex-1 bg-light-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 justify-center items-center p-6 mt-4">
          {/* Header */}
          <View className="items-center mb-8">
            <Text className="text-5xl md:text-7xl font-light text-primary mb-2">
              Welcome !
            </Text>
            <Text className="text-2xl md:text-3xl text-green-800 font-medium">
              Sign Up Success
            </Text>
          </View>

          {/* Code Input */}
          <View className="w-full items-center mt-10 mb-8">
            <Text className="text-lg font-medium text-gray-700 mb-4">
              Enter Your Parent&#39;s Code
            </Text>

            <View className="flex-row justify-center gap-2 mb-4">
              {inputCode.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  className="w-14 h-14 bg-white rounded-lg border-2 border-gray-200 text-center shadow-sm text-xl font-bold text-gray-800"
                  value={digit}
                  onChangeText={(t) => handleInputChange(t, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  maxLength={1}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  textAlign="center"
                />
              ))}
            </View>

            <Text className="text-sm text-gray-600 text-center mt-2 px-4">
              Enter the 6-digit code shown on your parent’s device.
            </Text>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            onPress={onContinuePress}
            disabled={checking}
            className={`w-full rounded-full py-4 mb-8 ${checking ? "bg-blue-400" : "bg-blue-500"}`}
          >
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                Continue
              </Text>
            )}
          </TouchableOpacity>

          {/* Illustration */}
          <View className="flex-1 justify-end items-center">
            <Image
              source={images.bgchilds}
              className="w-auto h-96"
              resizeMode="contain"
            />
          </View>
        </View>
      </ScrollView>

      {/* Confirm Parent Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="slide"
        onRequestClose={onCancelConfirm}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-3xl px-5 pt-5 pb-6">
            <Text className="text-lg font-semibold mb-2">Confirm Parent</Text>
            {foundParent ? (
              <View className="mb-4">
                <Text className="text-base text-neutral-900">
                  {foundParent.fullName || "Unnamed Parent"}
                </Text>
                {foundParent.email ? (
                  <Text className="text-sm text-neutral-600">
                    {foundParent.email}
                  </Text>
                ) : null}
                <Text className="text-sm text-neutral-500 mt-1">
                  Code: {foundParent.parentCode}
                </Text>
              </View>
            ) : null}

            <View className="flex-row gap-3 mt-2">
              <TouchableOpacity
                onPress={onCancelConfirm}
                className="flex-1 items-center py-3 rounded-2xl bg-neutral-200"
              >
                <Text className="text-neutral-900">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onConfirmLink}
                className="flex-1 items-center py-3 rounded-2xl bg-green-600"
              >
                <Text className="text-white font-semibold">Confirm</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => {
                setConfirmVisible(false);
                resetCodeInputs();
              }}
              className="mt-4 items-center"
            >
              <Text className="text-blue-600">Enter a different code</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ChildWelcomeScreen;
