import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Plus, X, Paperclip } from 'lucide-react';

const Notice = () => {
    const [notices, setNotices] = useState([]);
    const [newNotice, setNewNotice] = useState({ title: '', content: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const { role } = useAuth();

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const noticesQuery = query(
                collection(db, 'notices'),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(noticesQuery);
            const noticesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate()
            }));
            setNotices(noticesList);
        } catch (error) {
            console.error('Error fetching notices:', error);
            setError('Failed to load notices: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newNotice.title.trim() || !newNotice.content.trim()) {
            setError('Please fill in all fields');
            return;
        }

        try {
            setLoading(true);
            const user = auth.currentUser;
            if (!user) {
                setError('You must be logged in to create a notice');
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                setError('User profile not found');
                return;
            }

            const userData = userDoc.data();
            const noticeData = {
                title: newNotice.title.trim(),
                content: newNotice.content.trim(),
                createdAt: serverTimestamp(),
                author: user.email,
                authorName: userData.name || userData.username || user.email,
                authorRole: userData.role
            };

            await addDoc(collection(db, 'notices'), noticeData);
            setNewNotice({ title: '', content: '' });
            setShowForm(false);
            await fetchNotices();
            setError('');
        } catch (error) {
            console.error('Error creating notice:', error);
            setError('Failed to create notice: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && notices.length === 0) {
        return (
            <div className="min-h-screen p-6 bg-[#f8f9fa]">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-6 bg-[#f8f9fa]">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-[#7e3af2] text-white p-6 rounded-lg mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-2">Notices</h2>
                        <p className="text-white/80">Important announcements and updates</p>
                    </div>
                    <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-20">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="9" cy="7" r="4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>

                {/* Add Notice Button */}
                {role === 'teacher' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex justify-end"
                    >
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-[#7e3af2] text-white px-4 py-2 rounded-lg hover:bg-[#6025d9] transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Add New Notice
                        </button>
                    </motion.div>
                )}

                {/* Form */}
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative"
                    >
                        <button
                            onClick={() => setShowForm(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="relative">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={newNotice.title}
                                    onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e3af2]"
                                    placeholder="Notice title"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Content
                                </label>
                                <textarea
                                    value={newNotice.content}
                                    onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7e3af2] h-32"
                                    placeholder="Notice content"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 bg-[#7e3af2] text-white rounded-lg hover:bg-[#6025d9] focus:outline-none focus:ring-2 focus:ring-[#7e3af2] disabled:opacity-50"
                                >
                                    {loading ? 'Posting...' : 'Post Notice'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                        {error}
                    </div>
                )}

                {/* Notices Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {notices.map((notice) => (
                        <motion.div
                            key={notice.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="relative group"
                        >
                            <div className="bg-white rounded-2xl border border-black/20 shadow-md hover:shadow-xl transition-all duration-300 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-green-700 group-hover:text-green-800 transition-colors">
                                            {notice.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                                {notice.authorRole}
                                            </span>
                                            <span>
                                                {notice.createdAt?.toLocaleDateString()} • {notice.createdAt?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold text-lg border-2 border-black/20">
                                            {notice.authorName.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="prose max-w-none text-gray-700 mb-4">
                                    {notice.content}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-black/10 pt-4">
                                    <div className="flex items-center gap-2">
                                        <Paperclip className="w-4 h-4" />
                                        <span>Attachments</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* No Notices Message */}
                {notices.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-md p-6">
                        <p className="text-gray-500">No notices available.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notice;