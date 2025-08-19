// // src/components/CodeEditor.jsx
// import React, { useEffect, useRef } from 'react'
// import * as monaco from 'monaco-editor'
// import * as Y from 'yjs'
// import { WebsocketProvider } from 'y-websocket'
// import { MonacoBinding } from 'y-monaco'

// const CodeEditor = ({ roomId = 'default-room' }) => {
//     const editorRef = useRef(null)
//     const containerRef = useRef(null)

//     useEffect(() => {
//         const ydoc = new Y.Doc()
//         const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc)
//         const yText = ydoc.getText('monaco')

//         const editor = monaco.editor.create(containerRef.current, {
//             value: '',
//             language: 'javascript',
//             theme: 'vs-dark',
//             automaticLayout: true,
//         })

//         new MonacoBinding(yText, editor.getModel(), new Set([editor]), provider.awareness)

//         editorRef.current = editor

//         return () => {
//             editor.dispose()
//             provider.disconnect()
//             ydoc.destroy()
//         }
//     }, [roomId])

//     return <div ref={containerRef} style={{ height: '90vh', width: '100%' }} />
// }

// export default CodeEditor

// ....
//....................................************************


// import Editor from "@monaco-editor/react";
// import { useEffect, useState } from "react";
// import { db } from "../firebase";
// import { doc, onSnapshot, setDoc } from "firebase/firestore";

// const CodeEditor = ({ teamId = "team1" }) => {
//   const [code, setCode] = useState("// Start coding...");

//   useEffect(() => {
//     const docRef = doc(db, "collab", teamId);

//     const unsub = onSnapshot(docRef, (docSnap) => {
//       if (docSnap.exists()) {
//         const data = docSnap.data();
//         if (data.code !== code) setCode(data.code);
//       }
//     });

//     return () => unsub();
//   }, [teamId]);

//   const handleChange = async (value) => {
//     setCode(value);
//     const docRef = doc(db, "collab", teamId);
//     await setDoc(docRef, { code: value });
//   };

//   return (
//     <Editor
//       height="500px"
//       language="javascript"
//       theme="vs-dark"
//       value={code}
//       onChange={handleChange}
//     />
//   );
// };

// export default CodeEditor;

///----------------------**********************-****___________

// components/CodeEditor.jsx
import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";

const CodeEditor = ({ teamId = "team1", language = "javascript" }) => {
  const [code, setCode] = useState("// Start coding...");

  useEffect(() => {
    const docRef = doc(db, "collab", teamId);

    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.code !== code) setCode(data.code);
      }
    });

    return () => unsubscribe();
  }, [teamId]);

  const handleChange = async (value) => {
    setCode(value);
    const docRef = doc(db, "collab", teamId);
    await setDoc(docRef, { code: value });
  };

  return (
    <div className="w-full h-full">
      <Editor
        height="80vh"
        theme="vs-dark"
        language={language}
        value={code}
        onChange={handleChange}
        defaultValue="// Write your code here"
        options={{
          fontSize: 16,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default CodeEditor;





////____________________*****************************&&&&&&&&&&&&&&&&&&&&&&
//below is the deepseek code

// import React, { useState, useEffect, useRef } from 'react';
// import Editor from '@monaco-editor/react';
// import { useTheme } from '../contexts/ThemeContext';
// import { useAuth } from '../contexts/AuthContext';
// import { GoogleGenerativeAI } from '@google/generative-ai';

// const CodeEditor = () => {
//   console.log("CodeEditor mounted"); // Check in console

//   const { theme } = useTheme();
//   const { currentUser } = useAuth();
//   const [language, setLanguage] = useState('javascript');
//   const [code, setCode] = useState('// Start coding here...');
//   const [output, setOutput] = useState('');
//   const [aiPrompt, setAiPrompt] = useState('');
//   const [aiResponse, setAiResponse] = useState('');
//   const [isAiLoading, setIsAiLoading] = useState(false);
//   const [isChatOpen, setIsChatOpen] = useState(false);
//   const [messages, setMessages] = useState([]);
//   const [message, setMessage] = useState('');
//   const socketRef = useRef(null);

//   // Supported languages
//   const languages = [
//     'javascript', 'typescript', 'html', 'css', 'python', 'java', 'c', 'cpp', 
//     'csharp', 'go', 'ruby', 'php', 'swift', 'kotlin', 'rust', 'scala', 
//     'dart', 'elixir', 'haskell', 'lua', 'perl', 'r', 'sql', 'yaml', 'json'
//   ];

//   // Initialize Gemini AI
//   const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

//   useEffect(() => {
//     // Initialize WebSocket connection for chat
//     const socket = new WebSocket('wss://your-socket-server.com');
//     socketRef.current = socket;

//     socket.onmessage = (event) => {
//       const newMessage = JSON.parse(event.data);
//       setMessages(prev => [...prev, newMessage]);
//     };

//     return () => {
//       socket.close();
//     };
//   }, []);

//   const handleEditorChange = (value) => {
//     setCode(value);
//     // Optional: Save to localStorage or Firestore
//   };

//   const runCode = async () => {
//     try {
//       // This is a simple client-side evaluation for demo purposes
//       // In production, you'd send to a secure backend or use WebAssembly
//       if (language === 'javascript') {
//         const result = eval(code);
//         setOutput(JSON.stringify(result, null, 2));
//       } else {
//         setOutput('Code execution is currently only supported for JavaScript in this demo.');
//       }
//     } catch (error) {
//       setOutput(`Error: ${error.message}`);
//     }
//   };

//   const askAI = async () => {
//     if (!aiPrompt.trim()) return;
    
//     setIsAiLoading(true);
//     try {
//       const model = genAI.getGenerativeModel({ model: "gemini-pro" });
//       const result = await model.generateContent(aiPrompt);
//       const response = await result.response;
//       const text = response.text();
//       setAiResponse(text);
      
//       // Add to chat history
//       const newMessage = {
//         sender: 'AI',
//         content: text,
//         timestamp: new Date().toISOString()
//       };
//       setMessages(prev => [...prev, newMessage]);
//     } catch (error) {
//       setAiResponse(`AI Error: ${error.message}`);
//     } finally {
//       setIsAiLoading(false);
//     }
//   };

//   const sendMessage = () => {
//     if (!message.trim() || !socketRef.current) return;
    
//     const newMessage = {
//       sender: currentUser?.email || 'Anonymous',
//       content: message,
//       timestamp: new Date().toISOString()
//     };
    
//     socketRef.current.send(JSON.stringify(newMessage));
//     setMessages(prev => [...prev, newMessage]);
//     setMessage('');
//   };

//   return (
//     <div className={`flex flex-col h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
//       <div className="flex-1 flex flex-col md:flex-row">
//         {/* Main Editor Area */}
//         <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
//           <div className="p-2 bg-gray-100 dark:bg-gray-800 flex items-center justify-between">
//             <select 
//               value={language}
//               onChange={(e) => setLanguage(e.target.value)}
//               className="p-2 rounded bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600"
//             >
//               {languages.map(lang => (
//                 <option key={lang} value={lang}>{lang}</option>
//               ))}
//             </select>
//             <button 
//               onClick={runCode}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Run Code
//             </button>
//           </div>
          
//           <div className="flex-1">
//             <Editor
//               height="100%"
//               language={language}
//               theme={theme === 'dark' ? 'vs-dark' : 'light'}
//               value={code}
//               onChange={handleEditorChange}
//               options={{
//                 minimap: { enabled: true },
//                 fontSize: 14,
//                 wordWrap: 'on',
//                 automaticLayout: true,
//               }}
//             />
//           </div>
          
//           <div className="h-1/4 border-t border-gray-200 dark:border-gray-700">
//             <div className="h-full p-2 bg-gray-50 dark:bg-gray-800 overflow-auto">
//               <pre className="text-sm">{output || 'Output will appear here...'}</pre>
//             </div>
//           </div>
//         </div>
        
//         {/* Right Sidebar - AI and Chat */}
//         <div className={`w-80 flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
//           {/* AI Assistant Section */}
//           <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//             <h3 className="font-bold mb-2">AI Assistant</h3>
//             <textarea
//               value={aiPrompt}
//               onChange={(e) => setAiPrompt(e.target.value)}
//               placeholder="Ask AI for code help..."
//               className="w-full p-2 mb-2 h-20 border rounded bg-white dark:bg-gray-700"
//             />
//             <button
//               onClick={askAI}
//               disabled={isAiLoading}
//               className="w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
//             >
//               {isAiLoading ? 'Thinking...' : 'Ask AI'}
//             </button>
//             {aiResponse && (
//               <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded text-sm">
//                 {aiResponse}
//               </div>
//             )}
//           </div>
          
//           {/* Chat Section */}
//           <div className="flex-1 flex flex-col">
//             <div className="p-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
//               <h3 className="font-bold">Chat</h3>
//               <button 
//                 onClick={() => setIsChatOpen(!isChatOpen)}
//                 className="p-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-700"
//               >
//                 {isChatOpen ? '▼' : '▲'}
//               </button>
//             </div>
            
//             {isChatOpen && (
//               <>
//                 <div className="flex-1 p-2 overflow-y-auto">
//                   {messages.map((msg, i) => (
//                     <div key={i} className="mb-2">
//                       <div className={`text-xs font-semibold ${
//                         msg.sender === 'AI' ? 'text-green-500' : 'text-blue-500'
//                       }`}>
//                         {msg.sender}
//                       </div>
//                       <div className="text-sm">{msg.content}</div>
//                     </div>
//                   ))}
//                 </div>
//                 <div className="p-2 border-t border-gray-200 dark:border-gray-700">
//                   <div className="flex">
//                     <input
//                       type="text"
//                       value={message}
//                       onChange={(e) => setMessage(e.target.value)}
//                       onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
//                       placeholder="Type a message..."
//                       className="flex-1 p-2 border rounded-l bg-white dark:bg-gray-700"
//                     />
//                     <button
//                       onClick={sendMessage}
//                       className="px-4 py-2 bg-blue-500 text-white rounded-r hover:bg-blue-600"
//                     >
//                       Send
//                     </button>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CodeEditor;