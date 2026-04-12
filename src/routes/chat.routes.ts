import { Router, Response } from "express";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// KisanX AI Chat Route — Powered by Google Gemini (Free)
router.post("/", protect, async (req: any, res: Response) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Messages array is required" });
  }

  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

    const systemPrompt = `You are KisanX AI, a smart and friendly agricultural assistant for Indian farmers. 
Your job is to help farmers with:
- Crop selection, planting schedules, and harvesting tips
- Soil health, fertilizers, and irrigation advice  
- Pest and disease identification and treatment
- Weather-based farming decisions
- Market prices and selling strategies
- Government schemes and subsidies for farmers

Always respond in a mix of Hindi and English (Hinglish) that is easy for Indian farmers to understand.
Keep responses concise, practical, and actionable.
Use simple language. Avoid overly technical jargon.
If asked something unrelated to farming/agriculture, politely redirect the conversation back to farming topics.`;

    const contents = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // ✅ gemini-1.5-flash-8b — free tier available
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.7,
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("Gemini API error:", JSON.stringify(error, null, 2));
      return res.status(500).json({ message: "AI service unavailable" });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text 
      || "Sorry, kuch problem ho gayi. Please dobara try karein.";

    res.json({ reply });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ message: "Chat service failed", error: error.message });
  }
});

export default router;