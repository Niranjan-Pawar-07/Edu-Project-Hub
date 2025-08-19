import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const getGeminiResponse = async (prompt, code, language) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const fullPrompt = `You are a code assistant. The user is working with ${language} code.
        Here's their code:
        ${code}
        
        User's question: ${prompt}
        
        Please provide a helpful response focusing on code improvement, debugging, or explanation.`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error getting Gemini response:', error);
        return 'Sorry, I encountered an error while processing your request. Please try again.';
    }
}; 