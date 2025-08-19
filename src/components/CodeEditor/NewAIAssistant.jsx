// import { useState, useRef, useEffect } from 'react';
// import { useAuth } from '../../contexts/AuthContext';
// import { FiSend } from 'react-icons/fi';

// const NewAIAssistant = ({ messages, onSendMessage }) => {
//     const { currentUser } = useAuth();
//     const [input, setInput] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const messagesEndRef = useRef(null);

//     const scrollToBottom = () => {
//         messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     };

//     useEffect(() => {
//         scrollToBottom();
//     }, [messages]);

//     const handleSendMessage = async (e) => {
//         e.preventDefault();
//         if (!input.trim() || isLoading) return;

//         setIsLoading(true);
//         try {
//             await onSendMessage(input);
//             setInput('');
//         } catch (error) {
//             console.error('Error sending message:', error);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="flex flex-col h-full mt-8">
//             {/* Messages Container */}
//             <div className="flex-1 overflow-y-auto">
//                 <div className="p-4 space-y-4 pb-40">
//                     {messages.map((message, index) => (
//                         <div
//                             key={index}
//                             className={`flex ${message.userId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
//                         >
//                             <div
//                                 className={`max-w-[80%] rounded-lg p-3 ${
//                                     message.userId === currentUser?.uid
//                                         ? 'bg-blue-500 text-white'
//                                         : 'bg-gray-100 text-gray-800'
//                                 }`}
//                             >
//                                 <div className="flex items-center mb-2">
//                                     <img
//                                         src={message.userPhotoURL}
//                                         alt={message.userDisplayName}
//                                         className="w-6 h-6 rounded-full mr-2"
//                                     />
//                                     <span className="text-sm font-medium">{message.userDisplayName}</span>
//                                 </div>
//                                 <p className="whitespace-pre-wrap">{message.content}</p>
//                                 <span className="text-xs opacity-70 mt-1 block">
//                                     {new Date(message.timestamp?.toDate()).toLocaleTimeString()}
//                                 </span>
//                             </div>
//                         </div>
//                     ))}
//                     <div ref={messagesEndRef} />
//                 </div>
//             </div>

//             {/* Input Form - Fixed at bottom */}
//             <div className="absolute bottom-[160px] left-0 right-0 bg-white border-t border-gray-200">
//                 <form onSubmit={handleSendMessage} className="p-4">
//                     <div className="flex space-x-2">
//                         <input
//                             type="text"
//                             value={input}
//                             onChange={(e) => setInput(e.target.value)}
//                             placeholder="Ask AI for help..."
//                             className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//                             disabled={isLoading}
//                         />
//                         <button
//                             type="submit"
//                             disabled={isLoading}
//                             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
//                         >
//                             <FiSend className="text-lg" />
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// export default NewAIAssistant; 


// import { useState } from 'react';


// const NewAIAssistant = ({ onSendMessage, messages }) => {
//   const [input, setInput] = useState('');

//   const sendMessage = () => {
//     if (input.trim()) {
//       onSendMessage(input);
//       setInput('');
//     }
//   };

//   return (
//     <div className="h-full flex flex-col p-4 bg-white border-l shadow-inner">
//       <h2 className="text-lg font-semibold mb-2 text-purple-600">🤖 Gemini AI Assistant</h2>

//       <div className="flex-1 overflow-y-auto mb-2 space-y-2">
//         {messages.map((msg, idx) => (
//           <div key={idx} className={`p-2 rounded ${msg.sender === 'user' ? 'bg-gray-100' : 'bg-green-100'}`}>
//             <strong>{msg.sender === 'user' ? 'You' : 'Gemini'}:</strong> <br />
//             <pre className="text-sm whitespace-pre-wrap">{msg.text}</pre>
//           </div>
//         ))}
//       </div>

//       <div className="flex gap-2 mt-2">
//         <input
//           type="text"
//           value={input}
//           onChange={(e) => setInput(e.target.value)}
//           className="flex-1 border rounded px-3 py-1 text-sm"
//           placeholder="Ask something..."
//         />
//         <button
//           onClick={sendMessage}
//           className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
//         >
//           Ask
//         </button>
//       </div>
//     </div>
//   );
// };

// export default NewAIAssistant;


// components/NewAIAssistant.jsx
import { useState } from "react";
// import { fetchGeminiResponse } from "../utils/geminiApi";
import { fetchGeminiResponse } from "../../utils/geminiApi";


const NewAIAssistant = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
  
    const newMessages = [...messages, { sender: "user", text: input }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
  
    const data = await fetchGeminiResponse(input);
    const aiReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
  
    setMessages((prev) => [...prev, { sender: "ai", text: aiReply }]);
    setLoading(false);
  };
  

  return (
    <div className="h-full flex flex-col p-4 bg-white border-l shadow-inner">
      <h2 className="text-lg font-semibold mb-2 text-purple-600">
        {/* 🤖 Gemini AI Assistant */}
        🤖 QueryMate
      </h2>

      <div className="flex-1 overflow-y-auto mb-2 space-y-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.sender === "user" ? "bg-gray-100" : "bg-green-100"
            }`}
          >
            <strong>{msg.sender === "user" ? "You" : "Gemini"}:</strong>
            {/* <pre className="text-sm whitespace-pre-wrap">{msg.text}</pre> */}
            {/* <pre>{typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse, null, 2)}</pre> */}

            {/* <pre className="text-sm whitespace-pre-wrap">{msg.text}</pre> */}

            <div
  className="text-sm whitespace-pre-wrap"
  dangerouslySetInnerHTML={{
    __html: msg.text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")         // Bold
      .replace(/\*(.*?)\*/g, "<em>$1</em>")                      // Italic
      .replace(/```([\s\S]*?)```/g, "<pre>$1</pre>")             // Code block
      .replace(/\n/g, "<br/>")                                   // New lines
  }}
></div>





          </div>
        ))}
        {loading && (
          <div className="p-2 rounded bg-green-100">
            <strong>Gemini:</strong>
            <pre className="text-sm whitespace-pre-wrap">Thinking...</pre>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded px-3 py-1 text-sm"
          placeholder="Ask something..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
        >
          Ask
        </button>
      </div>
    </div>
  );
};

export default NewAIAssistant;
