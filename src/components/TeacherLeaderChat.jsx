import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const TeacherLeaderChat = () => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [teamLeaders, setTeamLeaders] = useState([]);
    const [selectedLeader, setSelectedLeader] = useState(null);
    const { currentUser, role } = useAuth();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (role === 'teacher') {
            fetchTeamLeaders();
        } else if (role === 'teamLeader') {
            fetchTeachers();
        }
    }, [role]);

    useEffect(() => {
        if (selectedLeader) {
            const unsubscribe = subscribeToMessages();
            return () => unsubscribe();
        }
    }, [selectedLeader]);

    const fetchTeamLeaders = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'teamLeader'));
            const querySnapshot = await getDocs(q);
            const leaders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeamLeaders(leaders);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching team leaders:', error);
            setError('Failed to load team leaders');
            setLoading(false);
        }
    };

    const fetchTeachers = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('role', '==', 'teacher'));
            const querySnapshot = await getDocs(q);
            const teachers = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTeamLeaders(teachers);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teachers:', error);
            setError('Failed to load teachers');
            setLoading(false);
        }
    };

    const subscribeToMessages = () => {
        if (!selectedLeader || !currentUser) return;

        const chatId = getChatId();
        const messagesRef = collection(db, 'teacherLeaderChats', chatId, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));

        return onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(newMessages);
            setLoading(false);
            scrollToBottom();
        });
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const getChatId = () => {
        if (!currentUser || !selectedLeader) return '';
        const participants = [currentUser.uid, selectedLeader.id].sort();
        return `${participants[0]}_${participants[1]}`;
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedLeader || !currentUser) return;

        try {
            const chatId = getChatId();
            await addDoc(collection(db, 'teacherLeaderChats', chatId, 'messages'), {
                text: newMessage.trim(),
                senderId: currentUser.uid,
                senderName: currentUser.displayName || currentUser.email,
                timestamp: serverTimestamp()
            });
            setNewMessage('');
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message. Please try again.');
            // Auto-clear error after 3 seconds
            setTimeout(() => setError(''), 3000);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)]">
            <div className="w-1/4 border-r border-gray-200 p-4">
                <h2 className="text-xl font-bold mb-4">
                    {role === 'teacher' ? 'Team Leaders' : 'Teachers'}
                </h2>
                {loading ? (
                    <div className="text-center">Loading...</div>
                ) : (
                    <ul className="space-y-2">
                        {teamLeaders.map((leader) => (
                            <li
                                key={leader.id}
                                className={`p-2 rounded cursor-pointer ${selectedLeader?.id === leader.id
                                    ? 'bg-blue-500 text-white'
                                    : 'hover:bg-gray-100'
                                    }`}
                                onClick={() => setSelectedLeader(leader)}
                            >
                                {leader.displayName || leader.email}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <div className="flex-1 flex flex-col">
                {selectedLeader ? (
                    <>
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold">
                                Chat with {selectedLeader.displayName || selectedLeader.email}
                            </h3>
                        </div>
                        {error && (
                            <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                                <span className="block sm:inline">{error}</span>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto p-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`mb-4 ${message.senderId === currentUser.uid
                                        ? 'text-right'
                                        : 'text-left'
                                        }`}
                                >
                                    <div
                                        className={`inline-block p-3 rounded-lg ${message.senderId === currentUser.uid
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200'
                                            }`}
                                    >
                                        <p>{message.text}</p>
                                        <small className="text-xs opacity-75">
                                            {message.senderName} •{' '}
                                            {message.timestamp?.toDate().toLocaleString()}
                                        </small>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 p-2 border rounded"
                                />
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                    Send
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a {role === 'teacher' ? 'team leader' : 'teacher'} to start chatting
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherLeaderChat; 