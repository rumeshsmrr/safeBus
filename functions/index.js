const express = require("express");
const cors = require("cors");
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { chatCompletion } = require("./gemini");

setGlobalOptions({
  region: "asia-south1",
  timeoutSeconds: 60,
  memory: "256MiB",
  secrets: ["GEMINI_API_KEY_SECRET"],
});

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true, ts: Date.now() }));
app.get("/check-secret", (req, res) =>
  res.json({ hasGeminiKey: !!process.env.GEMINI_API_KEY_SECRET })
);

const SYSTEM_PROMPT = `
You are SafeBus Assistant — concise, friendly, and helpful.
Answer as the SafeBus app’s chatbot. Be practical and short unless asked for details.
You can explain: tracking, notifications, emergencies, lost & found, buddy system,
rating, “not attending”, registration for parent/child/driver, and common app tips.
If information is unclear, ask a brief follow‑up question.
`;

app.post("/chat", async (req, res) => {
  try {
    // Minimal guard instead of Zod
    const body = req.body || {};
    const msg = typeof body.message === "string" ? body.message.trim() : "";
    if (!msg) return res.status(400).json({ error: "bad_request" });

    const reply = await chatCompletion({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: msg }],
    });

    return res.json({ reply });
  } catch (err) {
    console.error("chat_failed:", { message: err?.message, stack: err?.stack });
    return res.status(500).json({ error: "chat_failed" });
  }
});

exports.api = onRequest(app);
