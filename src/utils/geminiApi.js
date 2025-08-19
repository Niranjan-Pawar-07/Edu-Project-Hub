// export async function fetchGeminiResponse(message) {
//     try {
//       const response = await fetch("http://localhost:5000/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message }),
//       });
  
//       const data = await response.json();
//       return { candidates: [{ content: { parts: [{ text: data.reply }] } }] };
//     } catch (error) {
//       console.error("Gemini API Error →", error);
//       return null;
//     }
//   }


const API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function fetchGeminiResponse(message) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }],
            },
          ],
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
