import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { deleteUser } from 'firebase/auth';
import { motion } from 'framer-motion';
import { User, Edit, Mail, Shield, Users, Trash2 } from 'lucide-react';

const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [team, setTeam] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setUserData(data);
                setNewUsername(data.name || '');

                // Fetch team data if user is part of a team
                if (data.teamId) {
                    const teamDoc = await getDoc(doc(db, 'teams', data.teamId));
                    if (teamDoc.exists()) {
                        setTeam({ id: teamDoc.id, ...teamDoc.data() });
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUsername = async () => {
        if (!newUsername.trim()) {
            setError('Username cannot be empty');
            return;
        }

        try {
            setLoading(true);
            const userRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userRef, {
                name: newUsername.trim()
            });

            setUserData(prev => ({ ...prev, name: newUsername.trim() }));
            setIsEditing(false);
            alert('Username updated successfully!');
        } catch (error) {
            console.error('Error updating username:', error);
            setError('Failed to update username');
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        if (window.confirm('Are you sure you want to sign out and delete your account? This action cannot be undone.')) {
            try {
                setLoading(true);

                // Delete user document from Firestore
                await deleteDoc(doc(db, 'users', auth.currentUser.uid));

                // If user is part of a team, update team members
                if (userData.teamId) {
                    const teamRef = doc(db, 'teams', userData.teamId);
                    const teamDoc = await getDoc(teamRef);
                    if (teamDoc.exists()) {
                        const teamData = teamDoc.data();
                        // Remove user from team members
                        const updatedMembers = teamData.members.filter(id => id !== auth.currentUser.uid);
                        await updateDoc(teamRef, { members: updatedMembers });
                    }
                }

                // Delete user authentication
                await deleteUser(auth.currentUser);

                // Sign out and redirect to login
                await auth.signOut();
                navigate('/login');
            } catch (error) {
                console.error('Error deleting account:', error);
                setError('Failed to delete account. Please try again.');
            } finally {
                setLoading(false);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 bg-[#f8f9fa]">
                <div className="max-w-2xl mx-auto">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-[#f8f9fa]">
            <div className="max-w-2xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-black/20 shadow-md p-6 mb-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[#7e3af2] flex items-center justify-center text-white font-semibold text-2xl border-2 border-black/20">
                                {userData?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-black">Profile</h2>
                                <p className="text-gray-500">Manage your account settings</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="bg-[#7e3af2] text-white px-4 py-2 rounded-lg hover:bg-[#6025d9] transition-colors flex items-center gap-2"
                                disabled={isEditing}
                            >
                                <Edit className="w-4 h-4" />
                                Edit Profile
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    <div className="space-y-6">
                        {/* Username Section */}
                        <div className="border-b border-black/10 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-4 mb-4">
                                <User className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-black">Username</h3>
                            </div>
                            {isEditing ? (
                                <div className="flex items-center gap-4">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        className="flex-1 p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e3af2]"
                                        placeholder="Enter new username"
                                        required
                                    />
                                    <button
                                        onClick={handleUpdateUsername}
                                        disabled={loading}
                                        className="bg-[#7e3af2] text-white px-4 py-2 rounded-lg hover:bg-[#6025d9] focus:outline-none focus:ring-2 focus:ring-[#7e3af2] disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setNewUsername(userData?.name || '');
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <p className="text-lg text-black">{userData?.name || 'Not set'}</p>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="text-[#7e3af2] hover:text-[#6025d9]"
                                    >
                                        <Edit className="w-4 h-4 inline-block" />
                                        Edit
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Email Section */}
                        <div className="border-b border-black/10 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-4 mb-4">
                                <Mail className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-black">Email</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <p className="text-lg text-black">{userData?.email}</p>
                            </div>
                        </div>

                        {/* Role Section */}
                        <div className="border-b border-black/10 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-4 mb-4">
                                <Shield className="w-5 h-5 text-gray-400" />
                                <h3 className="text-lg font-semibold text-black">Role</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 bg-[#7e3af2]/20 text-[#7e3af2] rounded-full text-sm font-medium">
                                    {userData?.role?.toUpperCase()}
                                </span>
                            </div>
                        </div>

                        {/* Team Section */}
                        {team && (
                            <div className="border-b border-black/10 pb-6 last:border-b-0 last:pb-0">
                                <div className="flex items-center gap-4 mb-4">
                                    <Users className="w-5 h-5 text-gray-400" />
                                    <h3 className="text-lg font-semibold text-black">Team</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    <p className="text-lg text-black">{team.name}</p>
                                    <span className="text-sm text-gray-500">
                                        {team.leaderId === auth.currentUser.uid ? 'Team Leader' : 'Team Member'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Delete Account Section */}
                        <div className="border-b border-black/10 pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-center gap-4 mb-4">
                                <Trash2 className="w-5 h-5 text-red-500" />
                                <h3 className="text-lg font-semibold text-black">Delete Account</h3>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={handleSignOut}
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;