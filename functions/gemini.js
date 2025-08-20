// functions/gemini.js
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Fast, widely available model
const MODEL = "gemini-1.5-flash";

function getClient() {
  const key = process.env.GEMINI_API_KEY_SECRET;
  if (!key) throw new Error("GEMINI_API_KEY_SECRET is not set");
  return new GoogleGenerativeAI(key); // <-- correct constructor for @google/generative-ai
}

function toHistory(messages) {
  // messages: [{ role: "user" | "assistant", content: string }]
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: String(m.content ?? "") }],
  }));
}

async function chatCompletion({ system, messages }) {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: MODEL,
    ...(system ? { systemInstruction: system } : {}),
  });

  const contents = toHistory(messages);

  let resp;
  try {
    resp = await model.generateContent({ contents });
  } catch (e) {
    throw new Error(
      "Gemini generateContent failed: " + (e?.message || String(e))
    );
  }

  const r = resp?.response;
  const text =
    (typeof r?.text === "function" ? r.text() : null) ||
    (Array.isArray(r?.candidates) &&
      r.candidates[0]?.content?.parts?.map((p) => p.text).join("\n")) ||
    "";

  return String(text || "").trim();
}

module.exports = { chatCompletion };
