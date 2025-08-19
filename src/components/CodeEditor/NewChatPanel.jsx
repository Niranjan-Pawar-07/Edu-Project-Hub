import React, { useState, useEffect, useRef } from 'react';
import { FiSend } from 'react-icons/fi';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

const EditorChatPanel = ({ teamId }) => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load all usernames once
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const map = {};
        usersSnapshot.forEach(doc => {
          const data = doc.data();
          map[doc.id] = data.name || data.email;
        });
        setUserMap(map);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Get current user's name
  useEffect(() => {
    const fetchUserName = async () => {
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(docRef);
        const userData = userDoc.exists() ? userDoc.data() : {};
        setUserName(userData.name || userData.email || currentUser.email);
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };
    fetchUserName();
  }, [currentUser]);

  // Load messages
  useEffect(() => {
    if (!teamId) return;

    const q = query(
      collection(db, 'teams', teamId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(data);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [teamId]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !currentUser || !teamId) return;

    try {
      const message = {
        content: input.trim(),
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email || 'Unknown User',
        userPhotoURL: currentUser.photoURL || '',
        timestamp: serverTimestamp()
      };

      await addDoc(collection(db, 'teams', teamId, 'messages'), message);
      setInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-300 rounded-md shadow">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.userId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] p-3 rounded-lg ${
                msg.userId === currentUser?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="text-xs font-semibold mb-1">
                {msg.userId === currentUser?.uid ? 'You' : (userMap[msg.userId] || msg.userDisplayName)}
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="text-[10px] mt-1 opacity-70">
                {msg.timestamp?.toDate?.().toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="absolute bottom-[144px] left-0 right-0 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="p-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all focus:ring-2 focus:ring-blue-500"
            >
              <FiSend className="text-lg" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditorChatPanel;

