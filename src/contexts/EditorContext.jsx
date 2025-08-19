import { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [theme, setTheme] = useState('vs-dark');
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFileManagerOpen, setIsFileManagerOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);

  const value = {
    code,
    setCode,
    language,
    setLanguage,
    theme,
    setTheme,
    isAiOpen,
    setIsAiOpen,
    isChatOpen,
    setIsChatOpen,
    isFileManagerOpen,
    setIsFileManagerOpen,
    currentFile,
    setCurrentFile
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};