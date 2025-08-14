import Header from "@/app/Components/header";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

/* =================== Types =================== */
type RouteSession = "morning" | "evening";
type StudentStatus = "ON_BUS" | "NOT_GOING" | "ABSENT" | "PICK_IN";

interface Student {
  id: string;
  name: string;
  address: string;
  avatar?: string;
  active?: boolean;
  statuses: Record<RouteSession, StudentStatus>;
}

/* ============== Status styling map ============== */
const STATUS_META: Record<
  StudentStatus,
  { label: string; pill: string; text: string }
> = {
  ON_BUS: { label: "On Bus", pill: "bg-amber-400", text: "text-amber-950" },
  NOT_GOING: { label: "Not Going", pill: "bg-pink-400", text: "text-white" },
  ABSENT: { label: "Ab", pill: "bg-red-500", text: "text-white" },
  PICK_IN: { label: "Pick In", pill: "bg-green-500", text: "text-white" },
};

/* ================= Dummy data ================== */
const INITIAL_STUDENTS: Student[] = [
  {
    id: "1",
    name: "Shenuki Dilsara",
    address: "No, Street, City, Town",
    active: true,
    statuses: { morning: "ON_BUS", evening: "PICK_IN" },
  },
  {
    id: "2",
    name: "Reniki Dilsara",
    address: "No, Street, City, Town",
    active: false,
    statuses: { morning: "NOT_GOING", evening: "NOT_GOING" },
  },
  {
    id: "3",
    name: "Phenuki Dilsara",
    address: "No, Street, City, Town",
    active: true,
    statuses: { morning: "ABSENT", evening: "ABSENT" },
  },
  {
    id: "4",
    name: "Shenuki Dilsara",
    address: "No, Street, City, Town",
    active: true,
    statuses: { morning: "PICK_IN", evening: "PICK_IN" },
  },
  {
    id: "5",
    name: "Menuki Dilsara",
    address: "No, Street, City, Town",
    active: true,
    statuses: { morning: "PICK_IN", evening: "PICK_IN" },
  },
  {
    id: "6",
    name: "Shenuki Dilsara",
    address: "No, Street, City, Town",
    active: true,
    statuses: { morning: "PICK_IN", evening: "PICK_IN" },
  },
];

/* ================== Helpers =================== */
function todayLabel() {
  const d = new Date();
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  return `Today ${day} ${month}.`;
}

/* ============ Emergency Modal ============ */

const EMERGENCY_PRESETS = [
  "Delay since breakdown",
  "Accident",
  "Heavy traffic delay",
  "Road closed / diversion",
  "Weather delay",
];

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void; // broadcast to all
}

const EmergencyModal: React.FC<EmergencyModalProps> = ({
  visible,
  onClose,
  onSend,
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const message = custom.trim() || selected || "";

  React.useEffect(() => {
    if (!visible) {
      setSelected(null);
      setCustom("");
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white px-4 pt-4 pb-6 rounded-t-3xl">
        <Text className="text-lg font-semibold mb-2">Emergency broadcast</Text>
        <Text className="text-[13px] text-neutral-500 mb-3">
          This will be sent to{" "}
          <Text className="font-semibold">all parents & students</Text>.
        </Text>

        <Text className="text-sm text-neutral-800 mb-2">Quick reasons</Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {EMERGENCY_PRESETS.map((label) => {
            const isActive = selected === label && !custom;
            return (
              <TouchableOpacity
                key={label}
                onPress={() => {
                  setSelected(label);
                  setCustom("");
                }}
                className={`px-3 py-2 rounded-full border ${
                  isActive
                    ? "bg-blue-600 border-blue-600"
                    : "border-neutral-300"
                }`}
              >
                <Text
                  className={`${isActive ? "text-white" : "text-neutral-800"} text-sm`}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm text-neutral-800 mb-2">Custom message</Text>
        <TextInput
          value={custom}
          onChangeText={setCustom}
          placeholder="Type your message…"
          multiline
          className="min-h-[80px] bg-neutral-50 rounded-2xl px-3 py-2 text-[15px] border border-neutral-200"
        />

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 items-center py-3 rounded-2xl bg-neutral-200"
          >
            <Text className="text-neutral-800">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!message}
            onPress={async () => {
              await onSend(message);
              onClose();
            }}
            className={`flex-1 items-center py-3 rounded-2xl ${
              message ? "bg-red-600" : "bg-neutral-300"
            }`}
          >
            <Text className="text-white font-semibold">Send Alert</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* ============ Notify Parent Modal ============ */

interface NotifyModalProps {
  visible: boolean;
  students: Student[];
  onClose: () => void;
  onSend: (studentIds: string[], message: string) => Promise<void> | void;
}

const NotifyModal: React.FC<NotifyModalProps> = ({
  visible,
  students,
  onClose,
  onSend,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");

  const allIds = React.useMemo(() => students.map((s) => s.id), [students]);
  const allSelected = selectedIds.size === allIds.length && allIds.length > 0;

  React.useEffect(() => {
    if (!visible) {
      setSelectedIds(new Set());
      setMsg("");
    }
  }, [visible]);

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === allIds.length ? new Set() : new Set(allIds)
    );
  };

  const canSend = selectedIds.size > 0 && msg.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white px-4 pt-4 pb-6 rounded-t-3xl max-h-[75%]">
        <Text className="text-lg font-semibold mb-2">Notify Parents</Text>

        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-neutral-600">
            Selected: <Text className="font-semibold">{selectedIds.size}</Text>{" "}
            / {students.length}
          </Text>
          <TouchableOpacity
            onPress={toggleAll}
            className="px-3 py-2 rounded-full bg-blue-600"
          >
            <Text className="text-white text-sm">
              {allSelected ? "Clear All" : "Select All"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="max-h-[220px] mb-3">
          {students.map((s) => {
            const checked = selectedIds.has(s.id);
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => toggle(s.id)}
                className="flex-row items-center justify-between py-2 border-b border-neutral-100"
              >
                <View className="flex-row items-center gap-3">
                  <View className="w-8 h-8 rounded-full bg-blue-200 items-center justify-center">
                    <Text className="text-blue-700">{s.name.charAt(0)}</Text>
                  </View>
                  <View>
                    <Text className="text-[15px] text-neutral-900">
                      {s.name}
                    </Text>
                    <Text
                      className="text-xs text-neutral-500"
                      numberOfLines={1}
                    >
                      {s.address}
                    </Text>
                  </View>
                </View>
                <View
                  className={`w-5 h-5 rounded ${
                    checked
                      ? "bg-blue-600"
                      : "bg-white border border-neutral-300"
                  }`}
                />
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text className="text-sm text-neutral-800 mb-2">Message</Text>
        <TextInput
          value={msg}
          onChangeText={setMsg}
          placeholder="Type your message to parents…"
          multiline
          className="min-h-[80px] bg-neutral-50 rounded-2xl px-3 py-2 text-[15px] border border-neutral-200"
        />

        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            onPress={onClose}
            className="flex-1 items-center py-3 rounded-2xl bg-neutral-200"
          >
            <Text className="text-neutral-800">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!canSend}
            onPress={async () => {
              await onSend(Array.from(selectedIds), msg.trim());
              onClose();
            }}
            className={`flex-1 items-center py-3 rounded-2xl ${
              canSend ? "bg-green-600" : "bg-neutral-300"
            }`}
          >
            <Text className="text-white font-semibold">Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

/* ============ Status Sheet (ADDED) ============ */

interface StatusSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (s: StudentStatus) => void;
  current: StudentStatus | null;
}

const StatusSheet: React.FC<StatusSheetProps> = ({
  visible,
  onClose,
  onSelect,
  current,
}) => {
  const options: StudentStatus[] = ["ON_BUS", "NOT_GOING", "ABSENT", "PICK_IN"];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="bg-white px-4 pt-4 pb-6 rounded-t-3xl">
        <Text className="text-lg font-semibold mb-3">Update Status</Text>
        <View className="gap-2">
          {options.map((key) => {
            const m = STATUS_META[key];
            const selected = current === key;
            return (
              <TouchableOpacity
                key={key}
                onPress={() => onSelect(key)}
                className={`flex-row items-center justify-between rounded-2xl px-4 py-3 border ${
                  selected ? "border-blue-500 bg-blue-50" : "border-neutral-200"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <View className={`w-8 h-8 rounded-full ${m.pill}`} />
                  <Text className="text-base">{m.label}</Text>
                </View>
                {selected ? <Text className="text-blue-600">✓</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={onClose}
          className="mt-4 bg-neutral-200 rounded-2xl py-3 items-center"
        >
          <Text className="text-neutral-800">Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

/* ================ Student Card ================ */
interface StudentCardProps {
  student: Student;
  session: RouteSession;
  onPressStatus: (studentId: string) => void;
}

const StudentCard: React.FC<StudentCardProps> = ({
  student,
  session,
  onPressStatus,
}) => {
  const statusKey = student.statuses[session];
  const m = STATUS_META[statusKey];

  return (
    <View
      className={`w-full rounded-2xl px-3 py-3 mb-3 bg-white/70 border border-white ${
        student.active ? "opacity-100" : "opacity-50"
      }`}
    >
      <View className="flex-row items-center">
        {/* Avatar */}
        <View className="mr-3">
          {student.avatar ? (
            <Image
              source={{ uri: student.avatar }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-blue-200 items-center justify-center">
              <Text className="text-blue-700 text-lg">
                {student.name?.charAt(0) ?? "S"}
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="flex-1">
          <Text className="text-xl text-neutral-900">{student.name}</Text>
          <Text className="text-lg text-neutral-500" numberOfLines={1}>
            {student.address}
          </Text>
        </View>

        {/* Status pill */}
        <TouchableOpacity
          onPress={() => onPressStatus(student.id)}
          disabled={!student.active}
          className={`flex-row items-center gap-2 px-3 py-2 rounded-full ${m.pill} ${m.text}`}
        >
          <Text className="text-sm">{m.label}</Text>
          <Text className="text-sm">▾</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/* ================== Main Screen ================== */
const scrollViewBottomPadding = 24;
const ACTION_BAR_HEIGHT = 72;

const BusHome: React.FC = () => {
  const [session, setSession] = useState<RouteSession>("morning");
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [sheetStudentId, setSheetStudentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // popups
  const [showEmergency, setShowEmergency] = useState(false);
  const [showNotify, setShowNotify] = useState(false);

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const dateText = useMemo(() => todayLabel(), []);

  const currentStudent = students.find((s) => s.id === sheetStudentId) ?? null;
  const currentStatus: StudentStatus | null = currentStudent
    ? currentStudent.statuses[session]
    : null;

  const handleSelectStatus = (newStatus: StudentStatus) => {
    if (!sheetStudentId) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.id === sheetStudentId
          ? { ...s, statuses: { ...s.statuses, [session]: newStatus } }
          : s
      )
    );
    setSheetStudentId(null);
  };

  // simulate API calls
  const sendEmergency = async (message: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      Alert.alert(
        "Emergency sent",
        `Message:\n${message}\n\nRecipients: All parents & students`
      );
    }, 600);
  };

  const sendParentNotifications = async (ids: string[], message: string) => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const names = students
        .filter((s) => ids.includes(s.id))
        .map((s) => s.name)
        .join(", ");
      Alert.alert(
        "Notification sent",
        `To parents of: ${names}\n\nMessage:\n${message}`
      );
    }, 600);
  };

  // Float above tab bar
  const FLOATING_GAP = 46;
  const bottomOffset = tabBarHeight + insets.bottom + FLOATING_GAP;

  return (
    <SafeAreaView
      className="flex-1 bg-light-100"
      edges={["top", "left", "right"]}
    >
      <View className="flex-1 relative">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom:
              scrollViewBottomPadding + bottomOffset + ACTION_BAR_HEIGHT,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top header */}
          <Header isCode={false} />

          {/* Date (optional) */}
          {/* <View className="mt-2">
            <Text className="text-[12px] text-neutral-500">{dateText}</Text>
          </View> */}

          {/* Session toggle */}
          <View className="mt-3 mb-4 flex-row items-center justify-center w-full gap-2">
            <Text
              className={`text-xl ${
                session === "morning" ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              Morning Route
            </Text>
            <Switch
              value={session === "evening"}
              onValueChange={(val) => setSession(val ? "evening" : "morning")}
              trackColor={{ false: "#d1d5db", true: "#93c5fd" }}
              thumbColor={"#2563eb"}
            />
            <Text
              className={`text-xl ${
                session === "evening" ? "text-neutral-900" : "text-neutral-400"
              }`}
            >
              Evening Route
            </Text>
          </View>

          {/* Students list */}
          <View className="mt-1">
            {students.map((s) => (
              <StudentCard
                key={s.id}
                student={s}
                session={session}
                onPressStatus={(id) => setSheetStudentId(id)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Floating action bar */}
        <View
          className="px-6"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: bottomOffset,
          }}
          pointerEvents="box-none"
        >
          <View className="flex-row items-center gap-4">
            <TouchableOpacity
              onPress={() => setShowEmergency(true)}
              disabled={isSaving}
              className="flex-1 bg-red-500 rounded-2xl py-4 items-center"
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Emergency
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowNotify(true)}
              disabled={isSaving}
              className="flex-1 bg-green-600 rounded-2xl py-4 items-center"
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-base font-semibold">
                  Notify Parent
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Status chooser */}
      <StatusSheet
        visible={!!sheetStudentId}
        onClose={() => setSheetStudentId(null)}
        onSelect={handleSelectStatus}
        current={currentStatus}
      />

      {/* Emergency popup */}
      <EmergencyModal
        visible={showEmergency}
        onClose={() => setShowEmergency(false)}
        onSend={sendEmergency}
      />

      {/* Notify parents popup */}
      <NotifyModal
        visible={showNotify}
        students={students}
        onClose={() => setShowNotify(false)}
        onSend={sendParentNotifications}
      />
    </SafeAreaView>
  );
};

export default BusHome;
