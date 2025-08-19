import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const RoleSelection = () => {
    const [role, setRole] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { currentUser, updateUserRole } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!role || !username.trim()) {
            setError('Please select a role and enter a username');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Update user document in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                role: role,
                name: username.trim(),
                isFirstLogin: false,
                teams: [], // Initialize empty teams array
                email: currentUser.email
            });

            // Update role in AuthContext
            await updateUserRole(role);

            // Redirect to dashboard
            navigate('/');
        } catch (err) {
            console.error('Error updating user role:', err);
            setError('Failed to update role. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter your username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 mb-2">Select Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        >
                            <option value="">Select a role</option>
                            <option value="teacher">Teacher</option>
                            <option value="teamLeader">Team Leader</option>
                            <option value="teamMember">Team Member</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-blue-300"
                    >
                        {loading ? 'Updating...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RoleSelection; 