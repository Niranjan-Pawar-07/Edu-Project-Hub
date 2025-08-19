// import React, { useState } from 'react';

// const FileManager = () => {
//   const [files, setFiles] = useState([
//     { id: 1, name: 'main.js', type: 'javascript' },
//     { id: 2, name: 'styles.css', type: 'css' },
//     { id: 3, name: 'index.html', type: 'html' },
//   ]);

//   const [newFileName, setNewFileName] = useState('');
//   const [newFileType, setNewFileType] = useState('javascript');

//   const handleCreateFile = (e) => {
//     e.preventDefault();
//     if (newFileName.trim()) {
//       const newFile = {
//         id: Date.now(),
//         name: newFileName,
//         type: newFileType,
//       };
//       setFiles([...files, newFile]);
//       setNewFileName('');
//     }
//   };

//   const handleDeleteFile = (fileId) => {
//     setFiles(files.filter(file => file.id !== fileId));
//   };

//   return (
//     <div className="h-full flex flex-col">
//       <div className="p-2 border-b border-gray-300">
//         <h3 className="text-lg font-semibold">Files</h3>
//       </div>

//       <div className="flex-1 overflow-y-auto p-2">
//         {files.map((file) => (
//           <div
//             key={file.id}
//             className="flex items-center justify-between p-2 hover:bg-gray-100 rounded"
//           >
//             <div className="flex items-center space-x-2">
//               <span className="text-sm">{file.name}</span>
//               <span className="text-xs text-gray-500">({file.type})</span>
//             </div>
//             <button
//               onClick={() => handleDeleteFile(file.id)}
//               className="text-red-500 hover:text-red-700"
//             >
//               ×
//             </button>
//           </div>
//         ))}
//       </div>

//       <div className="p-2 border-t border-gray-300">
//         <form onSubmit={handleCreateFile} className="space-y-2">
//           <input
//             type="text"
//             value={newFileName}
//             onChange={(e) => setNewFileName(e.target.value)}
//             placeholder="New file name"
//             className="w-full p-2 border rounded"
//           />
//           <select
//             value={newFileType}
//             onChange={(e) => setNewFileType(e.target.value)}
//             className="w-full p-2 border rounded"
//           >
//             <option value="javascript">JavaScript</option>
//             <option value="css">CSS</option>
//             <option value="html">HTML</option>
//             <option value="python">Python</option>
//             <option value="java">Java</option>
//           </select>
//           <button
//             type="submit"
//             className="w-full bg-green-500 text-white px-4 py-2 rounded"
//           >
//             Create File
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default FileManager; 


import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, serverTimestamp, query, orderBy, doc } from 'firebase/firestore';
import { ref, uploadString, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../../firebase'; // Adjust path if needed
import { useEditor } from '../../contexts/EditorContext';
import { languages } from '../../utils/languages'; // Adjust path if needed
import { FiFile, FiPlus, FiTrash2 } from 'react-icons/fi'; // Example icons

const FileManager = ({ teamId }) => { // Removed onOpenFile, using context directly
  const [files, setFiles] = useState([]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('javascript'); // Default file type
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentFile, currentFile } = useEditor();
  const currentUser = auth.currentUser;

  // Fetch files from Firestore on teamId change
  useEffect(() => {
    const fetchFiles = async () => {
      if (!teamId) {
        setFiles([]); // Clear files if no teamId
        return;
      }
      setLoading(true);
      setError('');
      try {
        const filesRef = collection(db, 'teams', teamId, 'files');
        const q = query(filesRef, orderBy('createdAt', 'desc')); // Order by creation date
        const snapshot = await getDocs(q);
        setFiles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching files:", err);
        setError("Failed to load files.");
      } finally {
        setLoading(false);
      }
    };
    fetchFiles();
  }, [teamId]);

  // Handle file creation
  const handleCreateFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim() || !teamId || !currentUser) {
      setError('File name and team selection are required.');
      return;
    }
    setLoading(true);
    setError('');

    const fileExt = languages[newFileType]?.ext || 'txt';
    const fileNameWithExt = newFileName.includes(`.${fileExt}`) ? newFileName.trim() : `${newFileName.trim()}.${fileExt}`;
    const storagePath = `teams/${teamId}/files/${Date.now()}_${fileNameWithExt}`; // Unique path
    const fileRef = ref(storage, storagePath);

    try {
      // Create file with initial content in storage
      await uploadString(fileRef, '// Start coding...', 'raw', { contentType: `text/${newFileType}` });

      // Create metadata in Firestore
      const docRef = await addDoc(collection(db, 'teams', teamId, 'files'), {
        name: fileNameWithExt,
        language: newFileType,
        storagePath: storagePath,
        ownerId: currentUser.uid, // Store owner ID
        createdAt: serverTimestamp(),
        lastModified: serverTimestamp(),
      });

      // Add new file to local state (or re-fetch)
      const newFile = { id: docRef.id, name: fileNameWithExt, language: newFileType, storagePath, ownerId: currentUser.uid };
      setFiles(prev => [newFile, ...prev]); // Add to the beginning
      setNewFileName('');
      setNewFileType('javascript'); // Reset type
    } catch (err) {
      console.error("Error creating file:", err);
      setError("Failed to create file.");
    } finally {
      setLoading(false);
    }
  };

  // Handle file deletion
  const handleDeleteFile = async (file) => {
    if (!teamId || !file || !file.id || !file.storagePath) return;
    // Optional: Add owner check: if (file.ownerId !== currentUser?.uid) { alert('Not authorized'); return; }
    if (!window.confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    setLoading(true);
    setError('');
    try {
      // Delete from Storage
      const fileStorageRef = ref(storage, file.storagePath);
      await deleteObject(fileStorageRef);

      // Delete from Firestore
      await deleteDoc(doc(db, 'teams', teamId, 'files', file.id));

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== file.id));
      // If the deleted file was the current file, clear it
      if (currentFile?.id === file.id) {
        setCurrentFile(null);
      }
    } catch (err) {
      console.error("Error deleting file:", err);
      setError(`Failed to delete ${file.name}.`);
    } finally {
      setLoading(false);
    }
  };

  // Handle opening a file
  const handleOpenFileClick = (file) => {
    setCurrentFile(file); // Update context
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header and Create Form */}
      <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Files</h3>
        <form onSubmit={handleCreateFile} className="space-y-2">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="New file name (e.g., script.js)"
            className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required
          />
          <div className="flex space-x-2">
            <select
               value={newFileType}
               onChange={(e) => setNewFileType(e.target.value)}
               className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
             >
              {Object.entries(languages)
                 .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                 .map(([key, { name }]) => (
                   <option key={key} value={key}>
                     {name}
                   </option>
                 ))}
             </select>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
            >
              <FiPlus />
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading && files.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Loading files...</p>}
        {!loading && files.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No files yet.</p>}

        {files.map((file) => (
          <div
            key={file.id}
            onClick={() => handleOpenFileClick(file)}
            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
              currentFile?.id === file.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center space-x-2 overflow-hidden">
              <FiFile className="flex-shrink-0" />
              <span className="text-sm truncate" title={file.name}>{file.name}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent opening file when clicking delete
                handleDeleteFile(file);
              }}
              className={`ml-2 text-gray-400 hover:text-red-500 p-1 rounded-full flex-shrink-0 ${currentFile?.id === file.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} // Show on hover or if active
              title="Delete file"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileManager;