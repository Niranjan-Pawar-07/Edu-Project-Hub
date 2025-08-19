import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { ref, getDownloadURL, uploadString } from 'firebase/storage';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../../firebase'; // Adjust path if needed
import { useEditor } from '../../contexts/EditorContext';
import { useFirebase } from '../../contexts/FirebaseContext'; // Assuming still used for members/chat context
import { useAuth } from '../../contexts/AuthContext';
import { languages } from '../../utils/languages'; // Adjust path if needed
import { getGeminiResponse } from '../../services/geminiService'; // Adjust path if needed
import NewAIAssistant from './NewAIAssistant';
import NewChatPanel from './NewChatPanel'; // Assuming this correctly uses teamId for Firestore path
import MemberList from './MemberList';
import FileManager from './FileManager';
import { FiFile, FiMessageSquare, FiCpu, FiDownload, FiCode, FiUsers, FiSave, FiX, FiSidebar } from 'react-icons/fi'; // Added icons

const NewCodeEditor = ({ teamId }) => { // Ensure teamId is passed as a prop
  const {
    code, setCode,
    language, setLanguage,
    isFileManagerOpen, setIsFileManagerOpen,
    isAiOpen, setIsAiOpen,
    isChatOpen, setIsChatOpen,
    currentFile, setCurrentFile // Get currentFile and setter from context
  } = useEditor();

  // const firebase = useFirebase(); // Assuming used for members/general chat state
  const { currentUser } = useAuth();
  // const [activeTab, setActiveTab] = useState('ai'); // Handled by opening panels
  const [localMessages, setLocalMessages] = useState([]); // Fallback/AI messages
  const [localMembers, setLocalMembers] = useState([]); // Fallback members
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // To show save feedback

  // Fetch members (example, adjust based on your context/needs)
  // useEffect(() => {
  //   if (currentUser && firebase?.updateMemberStatus) {
  //     firebase.updateMemberStatus(true);
  //     return () => firebase.updateMemberStatus(false);
  //   }
  // }, [currentUser, firebase]);

  // Load file content when currentFile changes
  useEffect(() => {
    const loadFileContent = async () => {
      if (currentFile && currentFile.storagePath) {
        setIsLoadingContent(true);
        setSaveStatus(''); // Clear save status when loading new file
        try {
          const fileRef = ref(storage, currentFile.storagePath);
          const url = await getDownloadURL(fileRef);
          const response = await fetch(url);
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const content = await response.text();
          setCode(content);
          setLanguage(currentFile.language || 'javascript');
        } catch (error) {
          console.error("Error loading file content:", error);
          setCode(`// Error loading file: ${currentFile.name}\n// ${error.message}`);
          // Maybe setCurrentFile(null) if loading fails critically?
        } finally {
          setIsLoadingContent(false);
        }
      } else if (!currentFile) {
         // Optionally reset editor when no file is selected
         setCode('// Select a file from the file manager to start coding...');
         setLanguage('javascript');
         setSaveStatus('');
      }
    };
    loadFileContent();
  }, [currentFile, setCode, setLanguage, setCurrentFile]); // Added setCurrentFile dependency

  // Save file content
  const handleSave = async () => {
    if (!currentFile || !currentFile.storagePath || !teamId) {
      setSaveStatus("Error: No file selected or file is invalid.");
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }
    setSaveStatus('Saving...');
    try {
      const fileStorageRef = ref(storage, currentFile.storagePath);
      await uploadString(fileStorageRef, code, 'raw', { contentType: `text/${currentFile.language || 'plain'}` }); // Add content type

      const fileDocRef = doc(db, 'teams', teamId, 'files', currentFile.id);
      await updateDoc(fileDocRef, {
        lastModified: serverTimestamp()
      });

      setSaveStatus(`Saved ${currentFile.name} successfully!`);
    } catch (error) {
      console.error("Error saving file:", error);
      setSaveStatus(`Error: Failed to save ${currentFile.name}.`);
    } finally {
       // Clear status message after a few seconds
       setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  // AI Message Handling (Simplified from your code, using local state)
  const handleAIMessage = async (message) => {
    if (!message.trim()) return;
    const userMsg = { sender: 'user', text: message, type: 'ai_user', timestamp: new Date() };
    setLocalMessages((prev) => [...prev, userMsg]);
    const thinkingMsg = { sender: 'ai', text: 'Thinking...', type: 'ai', timestamp: new Date() };
    setLocalMessages((prev) => [...prev, thinkingMsg]);

    try {
        const prompt = `Context: ${language} code. File: ${currentFile?.name || 'untitled'}. Question: ${message}\n\nCode:\n${code}`;
        const response = await getGeminiResponse(prompt); // Assuming getGeminiResponse takes only prompt
        const aiMsg = { sender: 'ai', text: response, type: 'ai', timestamp: new Date() };
        setLocalMessages((prev) => [...prev.slice(0, -1), aiMsg]); // Replace thinking message
    } catch (err) {
        const errorMsg = { sender: 'ai', text: '⚠️ Failed to fetch AI response.', type: 'ai', timestamp: new Date() };
        setLocalMessages((prev) => [...prev.slice(0, -1), errorMsg]); // Replace thinking message
        console.error('Error getting AI response:', err);
    }
  };

  // Chat Message Handling (Passes to panel)
  const handleChatMessage = async (message) => {
    // The NewChatPanel component should handle sending the message
    // Ensure it has access to teamId and currentUser
    console.log("Attempting to send chat message:", message);
    // You might need a ref to NewChatPanel to call a send method,
    // or rely on context/props if NewChatPanel handles its own sending.
  };


  // Determine messages for display (Example using local for AI, context/direct for chat)
  // const displayMessages = isAiOpen ? localMessages.filter(m => m.type?.startsWith('ai')) : (firebase?.messages || []).filter(m => m.type === 'user');
  // const displayMembers = firebase?.members || localMembers;
   const aiMessages = localMessages.filter(m => m.type === 'ai' || m.type === 'ai_user');
   // Chat messages would be fetched directly within NewChatPanel using teamId

  // Determine members (example using fallback)
  const displayMembers = localMembers; // Replace with actual member fetching if FirebaseContext isn't used


  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* File Manager Sidebar */}
      <div className={`fixed left-0 top-0 bottom-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isFileManagerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
         {/* Pass teamId to FileManager */}
        <FileManager teamId={teamId} />
      </div>

      {/* Main Editor Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isFileManagerOpen ? 'ml-64' : 'ml-0'
      } ${isAiOpen || isChatOpen ? 'mr-80' : 'mr-0'}`}> {/* Adjust margin based on right sidebar */}

        {/* Header */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-850 shadow-sm flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            {/* File Manager Toggle */}
            <button
                onClick={() => setIsFileManagerOpen(!isFileManagerOpen)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                    isFileManagerOpen
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow-inner'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
                title={isFileManagerOpen ? "Close File Manager" : "Open File Manager"}
            >
              {isFileManagerOpen ? <FiX className="text-lg" /> : <FiSidebar className="text-lg" />}
            </button>

             {/* Language Selector */}
             <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
                <FiCode className="text-gray-600 dark:text-gray-400" />
                <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-gray-300 text-sm font-medium min-w-[100px]"
                    // className="bg-transparent border-none focus:outline-none focus:ring-0 text-gray-800 dark:text-white font-semibold text-sm min-w-[120px]"
                    disabled={isLoadingContent}
                >
                  {Object.entries(languages)
                      .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                      .map(([key, { name }]) => (
                          <option key={key} value={key} className="text-gray-800 dark:text-white font-semibold bg-white dark:bg-gray-800">
                              {name}
                          </option>
                      ))}
                </select>
            </div>
             {/* Current File Name */}
             {currentFile && (
                <span className="text-sm text-gray-500 dark:text-gray-400 truncate ml-2" title={currentFile.name}>
                    {currentFile.name}
                </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
             {/* Save Button */}
             <button
                onClick={handleSave}
                disabled={!currentFile || isLoadingContent}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save current file"
              >
                <FiSave className="text-base" />
                <span>Save</span>
              </button>
               {saveStatus && <span className="text-xs text-gray-500 dark:text-gray-400">{saveStatus}</span>}

            {/* Download Button */}
            <button
              onClick={() => { /* Download logic from original code */ }}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <FiDownload className="text-base" />
              <span>Download</span>
            </button>

            {/* AI Toggle */}
            <button
              onClick={() => { setIsAiOpen(!isAiOpen); setIsChatOpen(false); }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                  isAiOpen
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="AI Assistant"
            >
              <FiCpu className="text-lg" />
            </button>

            {/* Chat Toggle */}
            <button
              onClick={() => { setIsChatOpen(!isChatOpen); setIsAiOpen(false); }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                  isChatOpen
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 shadow-inner'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
              title="Team Chat"
            >
              <FiMessageSquare className="text-lg" />
            </button>
          </div>
        </div>

        {/* Monaco Editor */}
        <div className="flex-1 relative min-h-0">
           {isLoadingContent && (
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 bg-opacity-50 flex items-center justify-center z-10">
                    <span className="text-gray-700 dark:text-gray-300">Loading file...</span>
                </div>
            )}
          <Editor
            key={currentFile?.id || 'empty'} // Force re-render on file change
            height="100%"
            language={language}
            value={code}
            onChange={(value) => setCode(value || '')} // Handle potential null/undefined value
            theme="vs-dark" // Consider making this dynamic with ThemeContext
            options={{ /* Your editor options */ minimap: { enabled: false }, /* ... */ }}
            loading={<div className="absolute inset-0 bg-gray-800 animate-pulse" />}
          />
        </div>
      </div>

      {/* Right Sidebar (AI/Chat) */}
      <div className={`fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-850 shadow-lg transform transition-transform duration-300 ease-in-out z-20 ${
          isAiOpen || isChatOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10 bg-white dark:bg-gray-850">
             <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {isAiOpen ? 'AI Assistant' : isChatOpen ? 'Team Chat' : ''}
             </h3>
             <button
                onClick={() => { setIsAiOpen(false); setIsChatOpen(false); }}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
                title="Close Panel"
             >
               <FiX className="text-lg" />
             </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden relative">
             {isAiOpen && (
                <div className="absolute inset-0">
                   <NewAIAssistant
                      // Pass only AI-related messages if you distinguish them
                      messages={aiMessages}
                      onSendMessage={handleAIMessage} // Use the local AI handler
                    />
                </div>
             )}
             {isChatOpen && teamId && ( // Ensure teamId is available for chat
               <div className="absolute inset-0">
                 {/* Pass teamId to NewChatPanel */}
                 <NewChatPanel teamId={teamId} />
               </div>
             )}
              {isChatOpen && !teamId && (
                 <div className="p-4 text-center text-gray-500">Select a team to enable chat.</div>
              )}
          </div>

          {/* Member List (Example, adjust as needed) */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
             <div className="p-4">
               <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active Members ({displayMembers.length})</h4>
               <div className="space-y-1 max-h-24 overflow-y-auto">
                  <MemberList members={displayMembers} />
               </div>
             </div>
           </div> */}
        </div>
      </div>
    </div>
  );
};

export default NewCodeEditor;