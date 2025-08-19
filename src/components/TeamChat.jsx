import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
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
import { useAuth } from '../contexts/AuthContext';
import VideoConference from './VideoConference';
import MeetingScheduler from './MeetingScheduler';

const TeamChat = ({ teamId }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();
    const messagesEndRef = useRef(null);
    const [userName, setUserName] = useState('');
    const [userMap, setUserMap] = useState({});
    const [userRole, setUserRole] = useState('');
    const [meeting, setMeeting] = useState(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Fetch all user names at once
    useEffect(() => {
        const fetchUserNames = async () => {
            try {
                const usersSnapshot = await getDocs(collection(db, 'users'));
                const users = {};
                usersSnapshot.forEach(doc => {
                    const userData = doc.data();
                    users[doc.id] = userData.name || userData.email;
                });
                setUserMap(users);
            } catch (error) {
                console.error('Error fetching user names:', error);
            }
        };

        fetchUserNames();
    }, []);

    // Fetch current user's name and role
    useEffect(() => {
        const fetchCurrentUserNameAndRole = async () => {
            if (!currentUser) return;

            try {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserName(userData.name || userData.email || currentUser.email);
                    setUserRole(userData.role || '');
                }
            } catch (error) {
                console.error('Error fetching current user name:', error);
                setUserName(currentUser.email);
            }
        };

        fetchCurrentUserNameAndRole();
    }, [currentUser]);

    // Fetch meeting state for video conference logic
    useEffect(() => {
        if (!teamId) return;
        const unsub = onSnapshot(doc(db, 'teams', teamId, 'meeting', 'current'), (docSnap) => {
            setMeeting(docSnap.exists() ? docSnap.data() : null);
        });
        return () => unsub();
    }, [teamId]);

    // Subscribe to messages
    useEffect(() => {
        if (!teamId) {
            setError('Team ID is missing');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const q = query(
                collection(db, 'teams', teamId, 'messages'),
                orderBy('timestamp', 'asc')
            );

            const unsubscribe = onSnapshot(q,
                (snapshot) => {
                    const messageData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setMessages(messageData);
                    setLoading(false);
                    scrollToBottom();
                },
                (error) => {
                    console.error('Error fetching messages:', error);
                    setError('Failed to load messages. Please try again.');
                    setLoading(false);
                }
            );

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up message listener:', error);
            setError('Failed to connect to chat. Please refresh the page.');
            setLoading(false);
        }
    }, [teamId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !teamId) {
            setError('Cannot send message. Please try again.');
            return;
        }
        // Only allow teachers, teamLeaders, or teamMembers to send messages
        if (!['teacher', 'teamLeader', 'teamMember'].includes(userRole)) {
            setError('You do not have permission to send messages in this chat.');
            return;
        }

        try {
            setError('');
            const messageData = {
                text: newMessage.trim(),
                senderId: currentUser.uid,
                senderName: userName || userMap[currentUser.uid] || currentUser.email,
                timestamp: serverTimestamp()
            };

            await addDoc(collection(db, 'teams', teamId, 'messages'), messageData);
            setNewMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message. Please try again.');
        }
    };

    if (!teamId) {
        return <div className="text-center py-4 text-red-500">Invalid team ID</div>;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full bg-white rounded-lg">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-t">
                    {error}
                </div>
            )}

            {/* Meeting Scheduler Section */}
            <div className="w-full flex-shrink-0 mb-4">
                <MeetingScheduler teamId={teamId} />
            </div>

            {/* Video Conference Section (only show if active) */}
            {meeting && meeting.isActive && (
                <div className="w-full flex-shrink-0 mb-4">
                    <VideoConference teamId={teamId} />
                </div>
            )}

            {/* Chat Section */}
            <div className="flex flex-col flex-1 h-[400px] overflow-y-auto p-4 space-y-4 bg-white border-t border-gray-200 scrollbar-thin scrollbar-thumb-blue-400 scrollbar-track-blue-100" style={{ maxHeight: '400px' }}>
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex ${message.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[70%] break-words rounded-lg px-4 py-2 ${message.senderId === currentUser?.uid
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 text-gray-900'
                                }`}
                        >
                            <div className="text-xs mb-1 font-medium">
                                {message.senderId === currentUser?.uid ? 'You' : (userMap[message.senderId] || message.senderName)}
                            </div>
                            <div>{message.text}</div>
                            <div className="text-xs mt-1 opacity-75">
                                {message.timestamp?.toDate().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || !currentUser || !teamId || !['teacher', 'teamLeader', 'teamMember'].includes(userRole)}
                        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TeamChat;