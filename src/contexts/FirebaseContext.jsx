import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from './AuthContext';

const FirebaseContext = createContext();

export const useFirebase = () => useContext(FirebaseContext);

export const FirebaseProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [members, setMembers] = useState([]);
    const [messages, setMessages] = useState([]);

    // Listen for real-time member updates
    useEffect(() => {
        if (!currentUser) return;

        const membersRef = collection(db, 'members');
        const q = query(membersRef, where('isOnline', '==', true));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const membersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMembers(membersList);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Listen for real-time chat messages
    useEffect(() => {
        if (!currentUser) return;

        const messagesRef = collection(db, 'messages');
        const q = query(messagesRef, orderBy('timestamp', 'asc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messagesList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesList);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Add a new message
    const sendMessage = async (message, type = 'user') => {
        if (!currentUser) return;

        try {
            await addDoc(collection(db, 'messages'), {
                content: message,
                type,
                userId: currentUser.uid,
                userDisplayName: currentUser.displayName,
                userPhotoURL: currentUser.photoURL,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    // Update member status
    const updateMemberStatus = async (isOnline) => {
        if (!currentUser) return;

        try {
            const memberRef = doc(db, 'members', currentUser.uid);
            await updateDoc(memberRef, {
                isOnline,
                lastSeen: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating member status:', error);
        }
    };

    const value = {
        members,
        messages,
        sendMessage,
        updateMemberStatus
    };

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
}; 