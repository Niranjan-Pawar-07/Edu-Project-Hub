import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFirstLogin, setIsFirstLogin] = useState(false);
    const [userData, setUserData] = useState(null);

    async function signup(email, password, role, username) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Create user document in Firestore
            const userData = {
                email: email,
                role: role,
                name: username,
                teams: [],
                isFirstLogin: false,
                createdAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', user.uid), userData);
            setRole(role);
            setUserData(userData);
            return user;
        } catch (error) {
            console.error('Error in signup:', error);
            throw error;
        }
    }

    async function login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const data = await loadUserData(user);
            if (!data) {
                throw new Error('User data not found');
            }
            return user;
        } catch (error) {
            console.error('Error in login:', error);
            throw error;
        }
    }

    async function googleSignIn() {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user document exists
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                // First time Google sign-in
                const newUserData = {
                    email: user.email,
                    isFirstLogin: true,
                    teams: [],
                    createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', user.uid), newUserData);
                setUserData(newUserData);
                setIsFirstLogin(true);
            } else {
                const data = await loadUserData(user);
                if (!data) {
                    throw new Error('User data not found');
                }
            }

            return user;
        } catch (error) {
            console.error('Error in googleSignIn:', error);
            throw error;
        }
    }

    async function logout() {
        try {
            setCurrentUser(null);
            setRole(null);
            setUserData(null);
            await signOut(auth);
        } catch (error) {
            console.error('Error in logout:', error);
            throw error;
        }
    }

    async function loadUserData(user) {
        try {
            if (!user) return null;

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setRole(data.role);
                setUserData(data);
                setIsFirstLogin(data.isFirstLogin || false);
                return data;
            } else {
                // If user document doesn't exist, create it
                const newUserData = {
                    email: user.email,
                    isFirstLogin: true,
                    teams: [],
                    createdAt: new Date().toISOString()
                };
                await setDoc(doc(db, 'users', user.uid), newUserData);
                setUserData(newUserData);
                setIsFirstLogin(true);
                return newUserData;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            if (error.code === 'permission-denied') {
                console.error('Permission denied when accessing user document');
            }
            return null;
        }
    }

    async function updateUserRole(newRole) {
        if (!currentUser) return;
        try {
            const updatedData = {
                role: newRole,
                isFirstLogin: false,
                updatedAt: new Date().toISOString()
            };

            await setDoc(doc(db, 'users', currentUser.uid), updatedData, { merge: true });
            setRole(newRole);
            setUserData(prev => ({ ...prev, ...updatedData }));
            setIsFirstLogin(false);
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    setCurrentUser(user);
                    const data = await loadUserData(user);
                    if (!data) {
                        console.error('Failed to load user data');
                    }
                } else {
                    setCurrentUser(null);
                    setRole(null);
                    setUserData(null);
                }
            } catch (error) {
                console.error('Error in auth state change:', error);
            } finally {
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        role,
        userData,
        isFirstLogin,
        signup,
        login,
        googleSignIn,
        logout,
        updateUserRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
