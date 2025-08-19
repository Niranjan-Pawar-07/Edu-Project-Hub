import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
    const [teamId, setTeamId] = useState(null);
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { role, currentUser } = useAuth();
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                if (!currentUser) {
                    alert('Access denied! Redirecting to login.');
                    navigate('/login');
                    return;
                }

                if (role === 'teamLeader' || role === 'teamMember') {
                    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setTeamId(userData.teamId);

                        if (userData.teamId) {
                            const teamDoc = await getDoc(doc(db, 'teams', userData.teamId));
                            if (teamDoc.exists()) {
                                setTeamName(teamDoc.data().name);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                alert('Error loading your data. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate, currentUser, role]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-8"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Welcome Banner */}
            <div className="bg-[#7e3af2] text-white p-6 rounded-lg mb-6 relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-sm font-medium mb-1">{currentDate}</p>
                    <h1 className="text-3xl font-bold mb-2">Welcome back !</h1>
                    <p className="text-white/80">Always stay updated in your Hub.</p>
                </div>
                <div className="absolute right-6 top-1/2 transform -translate-y-1/2 opacity-20">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            </div>

            {/* Role-specific content */}
            {role === 'teacher' && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">Teacher Dashboard</h3>
                    <p className="text-gray-600 mb-4">As a teacher, you can:</p>
                    <ul className="list-disc list-inside text-gray-600 mb-4 pl-2">
                        <li className="mb-2">View and manage all teams</li>
                        <li className="mb-2">Communicate with team leaders</li>
                        <li className="mb-2">Monitor team progress</li>
                        <li className="mb-2">Post notices and announcements</li>
                    </ul>
                    <button
                        onClick={() => navigate('/teams')}
                        className="bg-[#7e3af2] text-white px-4 py-2 rounded-md hover:bg-[#6025d9] transition-colors"
                    >
                        View All Teams
                    </button>
                </div>
            )}

            {role === 'teamLeader' && !teamId && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">Create Your Team</h3>
                    <p className="text-gray-600 mb-4">You haven't created a team yet. Click the button below to create one.</p>
                    <button
                        onClick={() => navigate('/create-team')}
                        className="bg-[#7e3af2] text-white px-4 py-2 rounded-md hover:bg-[#6025d9] transition-colors"
                    >
                        Create Team
                    </button>
                </div>
            )}

            {role === 'teamLeader' && teamId && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">Your Team</h3>
                    <p className="text-gray-600 mb-4">You are the leader of team "{teamName}". Click the button below to manage your team.</p>
                    <button
                        onClick={() => navigate('/teams')}
                        className="bg-[#7e3af2] text-white px-4 py-2 rounded-md hover:bg-[#6025d9] transition-colors"
                    >
                        Manage Team
                    </button>
                </div>
            )}

            {role === 'teamMember' && teamId && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold mb-4">Your Team</h3>
                    <p className="text-gray-600 mb-4">You are a member of team "{teamName}". Click the button below to view team details.</p>
                    <button
                        onClick={() => navigate('/teams')}
                        className="bg-[#7e3af2] text-white px-4 py-2 rounded-md hover:bg-[#6025d9] transition-colors"
                    >
                        View Team
                    </button>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
