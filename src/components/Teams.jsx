import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { currentUser, role } = useAuth();

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                setError('');
                let teamsQuery;

                if (role === 'teacher') {
                    // Teachers can see all teams
                    teamsQuery = query(collection(db, 'teams'));
                } else if (role === 'teamLeader') {
                    // Team leaders can see teams where they are the leader
                    teamsQuery = query(
                        collection(db, 'teams'),
                        where('leaderId', '==', currentUser.uid)
                    );
                } else {
                    // Team members can see teams they are part of
                    teamsQuery = query(
                        collection(db, 'teams'),
                        where('members', 'array-contains', currentUser.uid)
                    );
                }

                const querySnapshot = await getDocs(teamsQuery);
                const teamsData = [];

                for (const doc of querySnapshot.docs) {
                    const teamData = { id: doc.id, ...doc.data() };

                    // Fetch leader details
                    if (teamData.leaderId) {
                        try {
                            const leaderDoc = await getDocs(
                                query(
                                    collection(db, 'users'),
                                    where('uid', '==', teamData.leaderId)
                                )
                            );
                            if (!leaderDoc.empty) {
                                const leaderData = leaderDoc.docs[0].data();
                                teamData.leaderName = leaderData.name || leaderData.email;
                            }
                        } catch (error) {
                            console.error('Error fetching leader details:', error);
                        }
                    }

                    teamsData.push(teamData);
                }

                setTeams(teamsData);
            } catch (error) {
                console.error('Error fetching teams:', error);
                setError('Failed to load teams. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, [currentUser, role]);

    const handleTeamClick = (teamId) => {
        navigate(`/team/${teamId}`);
    };

    // Function to dissolve a team (modular Firestore syntax)
    const handleDissolveTeam = async (teamId) => {
        if (!window.confirm('Are you sure you want to dissolve this team? This action cannot be undone.')) return;
        try {
            setLoading(true);
            // Delete the team document (modular syntax)
            await import('firebase/firestore').then(async ({ deleteDoc, doc, updateDoc }) => {
                await deleteDoc(doc(db, 'teams', teamId));
                // Remove teamId and teams from leader's user doc
                if (currentUser?.uid) {
                    await updateDoc(doc(db, 'users', currentUser.uid), {
                        teamId: null,
                        teams: []
                    });
                }
            });
            setTeams(teams.filter(t => t.id !== teamId));
        } catch (err) {
            alert('Failed to dissolve team: ' + (err?.message || err));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7e3af2]"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 text-red-500 text-center">
                {error}
            </div>
        );
    }

    // Function to generate initials for team members
    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    return (
        <div>
            {/* Teams Overview Header */}
            <div className="bg-[#7e3af2] text-white p-6 rounded-lg mb-6 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-2xl font-bold mb-2">Teams Overview</h1>
                    <p className="text-white/80">Manage and collaborate with your teams</p>
                </div>
            </div>

            {/* Team Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team, index) => {
                    // Generate unique color based on team name hash
                    const colorHash = team.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                    const hue = (colorHash % 360) + 120; // Offset to avoid red/yellow
                    const saturation = 80;
                    const lightness = 50;
                    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

                    return (
                        <motion.div
                            key={team.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            onClick={() => handleTeamClick(team.id)}
                            className="group relative overflow-hidden rounded-2xl"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[#7e3af2]/10 pointer-events-none" />
                            <div className="bg-white rounded-2xl border border-black/20 shadow-md hover:shadow-xl hover:border-black/50 transition-all duration-300 p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-xl font-bold text-black group-hover:text-[#7e3af2] transition-colors">
                                        {team.name}
                                    </h3>
                                    <div className="w-10 h-10 rounded-full bg-[#7e3af2] flex items-center justify-center text-white font-semibold text-lg border-2 border-black/20">
                                        {team.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <div className="flex items-center text-sm text-gray-500 border-b border-black/10 pb-2">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        <span>Last active: {team.lastActive || 'Today'}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-500 border-b border-black/10 pb-2">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                                        </svg>
                                        <span>{team.messages || 0} messages</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm text-gray-500 border-b border-black/10 pb-2">
                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                        </svg>
                                        <span>{team.tasks || 0} tasks</span>
                                    </div>
                                </div>
                                
                                {/* Member Avatars */}
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {team.members && team.members.slice(0, 4).map((memberId, memberIndex) => (
                                        <div key={memberId} 
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium -ml-1 first:ml-0 border-2 border-white
                                                    ${memberIndex === 0 ? 'bg-[#7e3af2]' : 
                                                   memberIndex === 1 ? 'bg-[#22c55e]' : 
                                                   memberIndex === 2 ? 'bg-[#f59e0b]' : 
                                                   memberIndex === 3 ? 'bg-[#db2777]' : ''}
                                                    text-white border border-black/20`}
                                        >
                                            {getInitials(team.leaderName || 'User')}
                                        </div>
                                    ))}
                                    
                                    {/* If there are more members, show a +X circle */}
                                    {team.members && team.members.length > 4 && (
                                        <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium -ml-1 border-2 border-white border border-black/20">
                                            +{team.members.length - 4}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="mt-6 text-right flex gap-2 justify-end">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleTeamClick(team.id);
                                        }}
                                        className="inline-flex items-center text-sm font-medium text-[#7e3af2] hover:text-[#6025d9] transition-colors border-b-2 border-transparent hover:border-[#7e3af2] pb-1"
                                    >
                                        View Details
                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                        </svg>
                                    </button>
                                    {role === 'teamLeader' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDissolveTeam(team.id);
                                            }}
                                            className="inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition-colors border-b-2 border-transparent hover:border-red-600 pb-1 ml-2"
                                        >
                                            Dissolve Team
                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Teams;
