// utils/fetchGemini.js
const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function fetchGeminiResponse(message) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
        }),
      }
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Gemini API Error →", error);
    return null;
  }
}
