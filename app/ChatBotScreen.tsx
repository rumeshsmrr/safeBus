import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const API_BASE = "https://api-ffvptbmj7q-el.a.run.app";
const CHAT_ROUTE = "/chat";
const ME = "parent-demo";

type Msg = { id: string; from: "me" | "bot"; text: string; ts: number };

async function callChatAPI(text: string, extraPayload: any = {}) {
  try {
    const res = await fetch(`${API_BASE}${CHAT_ROUTE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        payload: { userId: ME, role: "parent", ...extraPayload },
      }),
    });

    const raw = await res.text();
    console.log("[chat] status:", res.status);
    console.log("[chat] raw:", raw);

    // Try to parse JSON if possible
    let data: any = null;
    try {
      data = JSON.parse(raw);
    } catch {}

    if (!res.ok) {
      const errText =
        (data && (data.error || data.message)) || `Server error ${res.status}`;
      return [
        {
          id: `bot-${Date.now()}`,
          from: "bot" as const,
          text: `⚠️ ${errText}`,
          ts: Date.now(),
        },
      ];
    }

    // Accept multiple common shapes
    const pickText = (): string | null => {
      if (typeof data?.reply === "string") return data.reply;
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.replies) && data.replies[0])
        return String(data.replies[0].text ?? data.replies[0]);
      if (Array.isArray(data?.messages) && data.messages[0])
        return String(data.messages[0].text ?? data.messages[0]);
      if (Array.isArray(data?.choices) && data.choices[0]?.message?.content)
        return String(data.choices[0].message.content);
      return null;
    };

    const chosen = pickText();
    if (chosen) {
      return [
        {
          id: `bot-${Date.now()}`,
          from: "bot" as const,
          text: chosen,
          ts: Date.now(),
        },
      ];
    }

    // If the API returns an array of texts
    if (Array.isArray(data)) {
      return data.map((t: any, i: number) => ({
        id: `bot-${Date.now()}-${i}`,
        from: "bot" as const,
        text: String(t?.text ?? t),
        ts: Date.now(),
      }));
    }

    // Unknown shape → show a helpful debug message once
    return [
      {
        id: `bot-${Date.now()}`,
        from: "bot" as const,
        text: "🤖 I couldn’t understand the server response. Check the console logs for details.",
        ts: Date.now(),
      },
    ];
  } catch (e: any) {
    console.log("[chat] fetch error:", e?.message || e);
    return [
      {
        id: `bot-${Date.now()}`,
        from: "bot" as const,
        text: `📶 Network error: ${e?.message || e}`,
        ts: Date.now(),
      },
    ];
  }
}

export default function ChatBotScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "seed-1",
      from: "bot",
      text: "Hi! 👋 I’m SafeBus Assistant. Ask about ETA, driver contact, emergencies, Lost & Found.",
      ts: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Msg>>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const myMsg: Msg = {
      id: `me-${Date.now()}`,
      from: "me",
      text: trimmed,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, myMsg]);
    setInput("");
    setSending(true);

    try {
      const replies = await callChatAPI(trimmed);
      setMessages((prev) => [...prev, ...replies]);
    } finally {
      setSending(false);
      requestAnimationFrame(() =>
        listRef.current?.scrollToEnd({ animated: true })
      );
    }
  };

  const renderItem = ({ item }: { item: Msg }) => {
    const mine = item.from === "me";
    return (
      <View
        className={`w-full my-1 px-2 flex-row ${mine ? "justify-end" : "justify-start"}`}
      >
        <View
          className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? "bg-blue-500" : "bg-gray-200"}`}
        >
          <Text className={mine ? "text-white" : "text-gray-800"}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* quick reply chips */}
        <View className="flex-row flex-wrap gap-2 p-3">
          {["ETA", "driver phone", "lost item", "emergency"].map((q) => (
            <TouchableOpacity
              key={q}
              className="bg-white border border-gray-300 rounded-full px-3 py-1"
              onPress={() => send(q)}
            >
              <Text className="text-xs text-gray-700">{q}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 8 }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View className="absolute bottom-0 left-0 right-0 flex-row items-end gap-2 p-2 bg-white border-t border-gray-200">
          <TextInput
            className="flex-1 min-h-[40px] max-h-[120px] px-3 py-2 rounded-lg border border-gray-300 bg-gray-50"
            placeholder="Type your question…"
            value={input}
            onChangeText={setInput}
            multiline
          />
          <TouchableOpacity
            className={`min-w-[64px] h-10 rounded-lg items-center justify-center px-3 ${
              input.trim() && !sending ? "bg-blue-500" : "bg-blue-300"
            }`}
            onPress={() => send(input)}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold">Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
