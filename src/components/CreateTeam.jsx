import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CreateTeam = () => {
    const [teamName, setTeamName] = useState('');
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [githubRepoLink, setGithubRepoLink] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [allUsers, setAllUsers] = useState([]);
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const usersSnap = await getDocs(collection(db, 'users'));
            const users = usersSnap.docs
                .map(doc => ({ uid: doc.id, ...doc.data() }))
                .filter(user =>
                    user.uid !== currentUser.uid && // Not the current user
                    user.role !== 'teacher' && // Not a teacher
                    user.role !== 'teamLeader' && // Not a team leader
                    (!user.teams || user.teams.length === 0) // Not in any team
                );
            setAllUsers(users);
        };
        if (currentUser?.uid) fetchUsers();
    }, [currentUser]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!teamName.trim()) {
            setError('Team name is required');
            return;
        }
        if (!projectName.trim()) {
            setError('Project name is required');
            return;
        }
        if (!projectDescription.trim()) {
            setError('Project description is required');
            return;
        }
        if (selectedMembers.length === 0) {
            setError('Please select at least one team member.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Check if team name already exists
            const teamsQuery = query(collection(db, 'teams'), where('name', '==', teamName.trim()));
            const teamsSnap = await getDocs(teamsQuery);
            if (!teamsSnap.empty) {
                setError('A team with this name already exists. Please choose a different name.');
                setLoading(false);
                return;
            }

            // Create team document
            const teamData = {
                name: teamName.trim(),
                projectName: projectName.trim(),
                projectDescription: projectDescription.trim(),
                githubRepo: githubRepoLink.trim(),
                leaderId: currentUser.uid,
                members: [currentUser.uid, ...selectedMembers], // Leader + selected
                createdAt: serverTimestamp(),
                isActive: true
            };

            const teamRef = await addDoc(collection(db, 'teams'), teamData);

            // Update leader's user doc
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                teams: [teamRef.id],
                teamId: teamRef.id
            });

            // Update selected members' docs (add team to their teams array)
            for (const memberId of selectedMembers) {
                const memberRef = doc(db, 'users', memberId);
                await updateDoc(memberRef, {
                    teams: [teamRef.id],
                    teamId: teamRef.id
                });
            }

            // Navigate to the new team's page
            navigate(`/team/${teamRef.id}`);
        } catch (error) {
            console.error('Error creating team:', error);
            setError('Failed to create team: ' + (error && error.message ? error.message : JSON.stringify(error)));
        } finally {
            setLoading(false);
        }
    };

    const handleMemberCheckbox = (user, checked) => {
        if (checked) {
            setSelectedMembers(prev => [...prev, user.uid]);
        } else {
            setSelectedMembers(prev => prev.filter(id => id !== user.uid));
        }
    };

    return (
        <div className="p-6">
            <div className="max-w-4xl mx-auto bg-gradient-to-br from-purple-50 to-white rounded-2xl shadow-xl p-12 border border-purple-200 relative overflow-hidden">
                <div className="absolute -top-8 -left-8 w-32 h-32 bg-purple-100 rounded-full opacity-20 z-0"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-extrabold mb-4 text-purple-700 flex items-center gap-2">
                        <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m0 0A4 4 0 0112 4a4 4 0 015 3.13M7 13a4 4 0 0010 0"></path></svg>
                        Create New Team
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-purple-100 text-purple-700 rounded border border-purple-300 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-1.414 1.414M6.343 17.657l-1.414-1.414M6.343 6.343l1.414 1.414M17.657 17.657l1.414-1.414M12 8v4m0 4h.01"></path></svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-purple-700 mb-1">
                                Team Name
                            </label>
                            <input
                                type="text"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50 placeholder-purple-300 text-black"
                                placeholder="Enter team name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-purple-700 mb-1">
                                Project Name
                            </label>
                            <input
                                type="text"
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50 placeholder-purple-300 text-black"
                                placeholder="Enter project name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-purple-700 mb-1">
                                Project Description
                            </label>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50 placeholder-purple-300 text-black"
                                placeholder="Enter project description"
                                rows="4"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-purple-700 mb-1">
                                GitHub Repository Link (Optional)
                            </label>
                            <input
                                type="url"
                                value={githubRepoLink}
                                onChange={(e) => setGithubRepoLink(e.target.value)}
                                className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50 placeholder-purple-300 text-black"
                                placeholder="https://github.com/username/repo"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-purple-700 mb-1">
                                Add Team Members
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-purple-200 rounded-lg p-2 bg-purple-50">
                                {allUsers.length === 0 && <div className="text-gray-400 text-sm">No available users to add</div>}
                                {allUsers.map(user => (
                                    <label key={user.uid} className="flex items-center space-x-2 mb-1">
                                        <input
                                            type="checkbox"
                                            value={user.uid}
                                            checked={selectedMembers.includes(user.uid)}
                                            onChange={e => handleMemberCheckbox(user, e.target.checked)}
                                            className="accent-green-500"
                                        />
                                        <span className="text-black font-medium text-sm">{user.name || user.email}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-semibold text-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Creating...' : 'Create Team'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateTeam;