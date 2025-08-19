import React, { useState } from "react";
import { fetchGeminiResponse } from "../utils/geminiApi";
import ReactMarkdown from "react-markdown";
import { motion } from 'framer-motion';
import { User, MessageSquare, Send, Loader2, Trash2 } from 'lucide-react';

const GeminiChat = () => {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [pastChats, setPastChats] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const data = await fetchGeminiResponse(input);
      const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
      setResponse(reply);
      setPastChats((prev) => [
        ...prev,
        { question: input, answer: reply, timestamp: new Date().toISOString() }
      ]);
    } catch (error) {
      setResponse("Sorry, I encountered an error. Please try again.");
      console.error('Error fetching response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-[#f8f9fa]">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-black/20 shadow-md p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#7e3af2] flex items-center justify-center text-white font-semibold text-2xl border-2 border-black/20">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-black">Gemini AI Assistant</h2>
                <p className="text-gray-500">Ask anything, get smart answers</p>
              </div>
            </div>
          </div>

          {pastChats.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[#7e3af2]">Past Chats</h3>
                <button
                  className="text-xs px-3 py-1 bg-[#7e3af2] text-white rounded hover:bg-[#6025d9] transition"
                  onClick={() => setPastChats([])}
                  type="button"
                  title="Delete all past chats"
                >
                  Delete All
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-3">
                {pastChats.map((chat, idx) => (
                  <div key={chat.timestamp + idx} className="relative group">
                    <button
                      type="button"
                      className="w-full text-left p-3 rounded-lg bg-white shadow flex flex-col gap-1 hover:bg-gray-100 focus:bg-purple-50 outline-none transition cursor-pointer"
                      onClick={() => {
                        setInput(chat.question);
                        setResponse(chat.answer);
                      }}
                    >
                      <div className="text-sm font-medium text-gray-700 truncate">Q: {chat.question}</div>
                      <div className="text-xs text-gray-500 truncate">A: {chat.answer}</div>
                    </button>
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full bg-white/80 group-hover:bg-red-50 transition flex items-center justify-center"
                      title="Delete this chat"
                      onClick={() => setPastChats(pastChats.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
              onClick={() => {
                setInput("");
                setResponse("");
              }}
            >
              + New Chat
            </button>
          </div>
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="relative">
              <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Ask something..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full p-4 pl-10 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e3af2]"
                disabled={loading}
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-[#7e3af2] text-white p-2 rounded-full hover:bg-[#6025d9] transition-colors"
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {response && (
            <div className="bg-white rounded-2xl border border-black/20 shadow-md p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#7e3af2] flex items-center justify-center text-white font-semibold text-lg border-2 border-black/20">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-black">Gemini Assistant</h3>
              </div>
              <div className="prose max-w-none text-gray-700">
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default GeminiChat;
