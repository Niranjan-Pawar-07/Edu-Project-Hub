import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, addDoc, updateDoc, collection, getDocs, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TeamChat from './TeamChat';
import { useAuth } from '../contexts/AuthContext';
import ReportMaker from './ReportMaker';
import { Chart } from 'react-google-charts';

// --- SPRINT STRUCTURE (STATIC FOR ALL TEAMS) ---
const SPRINTS = [
  {
    number: 1,
    title: 'Kickoff & Ideation (Weeks 1-2)',
    goals: [
      'Team formation',
      'Idea brainstorming',
      'Initial project scope',
    ],
    deliverables: [
      'Team & role sheet',
      'Shortlisted ideas',
      'Draft project objective document',
    ],
  },
  {
    number: 2,
    title: 'Problem Definition (Week 3)',
    goals: [
      'Finalize project topic',
      'Define clear problem statement',
      'Analyze requirements',
    ],
    deliverables: [
      'Problem statement',
      'Requirement analysis doc',
      'Feasibility report',
    ],
  },
  {
    number: 3,
    title: 'Research & Design (Weeks 4-5)',
    goals: [
      'Explore existing solutions',
      'Design system architecture',
    ],
    deliverables: [
      'Literature review report',
      'Design diagrams (UML, flowchart)',
      'Schema & tech stack doc',
    ],
  },
  {
    number: 4,
    title: 'Module Development I (Weeks 6-8)',
    goals: [
      'Start coding individual modules',
    ],
    deliverables: [
      'Functional module prototypes',
      'Unit test reports',
    ],
  },
  {
    number: 5,
    title: 'Mid-Sem Review & Planning (Week 9)',
    goals: [
      'Present progress to mentors',
      'Refine scope/timelines',
    ],
    deliverables: [
      'Progress presentation',
      'Updated plan and timeline',
    ],
  },
  {
    number: 6,
    title: 'System Integration (Weeks 10-12)',
    goals: [
      'Integrate modules into a single system',
    ],
    deliverables: [
      'Integrated system',
      'System test & debug logs',
    ],
  },
  {
    number: 7,
    title: 'Documentation & Presentation Prep (Week 13)',
    goals: [
      'Finalize documentation',
      'Prepare for demo day',
    ],
    deliverables: [
      'Documentation draft',
      'Presentation slides & demo plan',
    ],
  },
  {
    number: 8,
    title: 'Final Submission & Review (Week 14)',
    goals: [
      'Showcase the project',
    ],
    deliverables: [
      'Project submission (code, docs, user manual)',
      'Final demo',
    ],
  },
];

// File Item Component
const FileItem = ({ file, team, onDelete }) => {
    const currentUser = auth.currentUser;
    const canDelete = team.leaderId === currentUser.uid || file.uploadedBy === currentUser.email;

    const getFileIcon = (fileType) => {
        switch (fileType.toLowerCase()) {
            case 'ppt':
            case 'pptx':
                return "📊";
            case 'pdf':
                return "📄";
            case 'doc':
            case 'docx':
                return "📝";
            case 'txt':
                return "📃";
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return "🖼️";
            default:
                return "📁";
        }
    };

    return (
        <div className="flex items-center justify-between p-3 bg-white shadow-sm rounded-md mb-2">
            <div className="flex items-center space-x-3">
                <span className="text-2xl">{getFileIcon(file.fileType)}</span>
                <div>
                    <p className="font-medium text-gray-900">{file.fileName}</p>
                    <p className="text-xs text-gray-500">
                        Uploaded by {file.uploadedBy} on {new Date(file.uploadedAt?.toDate()).toLocaleString()}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <a
                    href={file.fileURL}
                    download={file.fileName}
                    className="text-green-500 hover:text-green-700"
                    title="Download file"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </a>
                {canDelete && (
                    <button
                        onClick={() => onDelete(file.id, file.publicId)}
                        className="text-red-500 hover:text-red-700"
                        title="Delete file"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
};

const TaskTimeline = ({ tasks }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'todo': return 'bg-gray-200';
            case 'ongoing': return 'bg-yellow-200';
            case 'completed': return 'bg-green-200';
            default: return 'bg-gray-200';
        }
    };

    const formatDate = (date) => {
        if (!date) return '';
        return new Date(date.seconds * 1000).toLocaleDateString();
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-xl font-semibold">Task Timeline</h3>
            <div className="space-y-4">
                {tasks.map((task) => (
                    <div key={task.id} className={`p-4 rounded-lg ${getStatusColor(task.status)} transition-all duration-200`}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-semibold">{task.title}</h4>
                                <p className="text-sm text-gray-600">{task.description}</p>
                                <div className="mt-2 text-sm">
                                    <span className="font-medium">Assigned to: </span>
                                    {task.assignedTo}
                                </div>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                <div>Created: {formatDate(task.createdAt)}</div>
                                {task.status === 'completed' && (
                                    <div>Completed: {formatDate(task.completedAt)}</div>
                                )}
                                <div className="mt-1">
                                    <span className={`px-2 py-1 rounded-full text-xs
                                        ${task.status === 'todo' ? 'bg-gray-500 text-white' :
                                            task.status === 'ongoing' ? 'bg-yellow-500 text-white' :
                                                'bg-green-500 text-white'}`}>
                                        {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Project Progress Chart Component
const ProjectProgressChart = ({ tasks, team }) => {
    const getProjectProgressData = () => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const ongoingTasks = tasks.filter(task => task.status === 'ongoing').length;
        const todoTasks = tasks.filter(task => task.status === 'todo').length;

        const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        const data = [
            [
                { type: 'string', label: 'Task Status' },
                { type: 'number', label: 'Number of Tasks' },
                { type: 'string', role: 'style' },
                { type: 'string', role: 'annotation' }
            ],
            ['Completed', completedTasks, '#4CAF50', `${completedTasks} tasks`],
            ['Ongoing', ongoingTasks, '#FFC107', `${ongoingTasks} tasks`],
            ['To Do', todoTasks, '#9E9E9E', `${todoTasks} tasks`]
        ];

        return { data, progress };
    };

    const { data, progress } = getProjectProgressData();

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Project Progress</h3>
                <div className="text-right">
                    <span className="text-2xl font-bold text-purple-600">{Math.round(progress)}%</span>
                    <span className="text-sm text-gray-500 ml-2">Complete</span>
                </div>
            </div>
            <div className="h-64">
                <Chart
                    chartType="BarChart"
                    width="100%"
                    height="100%"
                    data={data}
                    options={{
                        title: `${team.projectName} Progress`,
                        titleTextStyle: {
                            fontSize: 16,
                            bold: true
                        },
                        legend: { position: 'none' },
                        hAxis: {
                            title: 'Number of Tasks',
                            minValue: 0
                        },
                        vAxis: {
                            title: 'Status'
                        },
                        chartArea: {
                            width: '80%',
                            height: '80%'
                        },
                        annotations: {
                            alwaysOutside: true,
                            textStyle: {
                                fontSize: 12,
                                color: '#000'
                            }
                        },
                        backgroundColor: {
                            fill: '#ffffff'
                        }
                    }}
                />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{tasks.filter(task => task.status === 'completed').length}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">{tasks.filter(task => task.status === 'ongoing').length}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-gray-500">{tasks.filter(task => task.status === 'todo').length}</div>
                    <div className="text-sm text-gray-600">To Do</div>
                </div>
            </div>
        </div>
    );
};

const TeamDetails = () => {
    const { teamId } = useParams();
    const [team, setTeam] = useState(null);
    const [teamMembers, setTeamMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '', sprintNumber: 1 });
    const [isEditingRepo, setIsEditingRepo] = useState(false);
    const [repoLink, setRepoLink] = useState('');
    const [uploadingFile, setUploadingFile] = useState(false);
    const { currentUser, role } = useAuth();
    const isTeamLeader = team?.leaderId === currentUser?.uid;
    const isTeacher = role === 'teacher';
    const [activeTab, setActiveTab] = useState('details');
    const [taskView, setTaskView] = useState('cards');
    const [isEditing, setIsEditing] = useState(false);
    const [editedTeam, setEditedTeam] = useState({ name: '', description: '', projectName: '', projectDescription: '' });
    const [showMemberManagement, setShowMemberManagement] = useState(false);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [selectedNewMembers, setSelectedNewMembers] = useState([]);
    const [showStatusUpdateModal, setShowStatusUpdateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [statusUpdate, setStatusUpdate] = useState('');
    const navigate = useNavigate();

    // --- SPRINT UI STATE ---
    const [expandedSprint, setExpandedSprint] = useState(1); // Default to Sprint 1 expanded
    const [openTaskId, setOpenTaskId] = useState(null);

    useEffect(() => {
        if (teamId) {
            fetchTeamData();
        }
    }, [teamId]);

    useEffect(() => {
        if (team) {
            setEditedTeam({
                name: team.name || '',
                description: team.description || '',
                projectName: team.projectName || '',
                projectDescription: team.projectDescription || ''
            });
        }
    }, [team]);

    const fetchAvailableUsers = async () => {
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs
            .map(doc => ({ uid: doc.id, ...doc.data() }))
            .filter(user =>
                user.uid !== currentUser.uid && // Not the current user
                user.role !== 'teacher' && // Not a teacher
                user.role !== 'teamLeader' && // Not a team leader
                (!user.teams || user.teams.length === 0) // Not in any team
            );
        setAvailableUsers(users);
    };

    const handleUpdateTeam = async () => {
        if (!editedTeam.name.trim()) {
            setError('Team name is required');
            return;
        }
        if (!editedTeam.projectName.trim()) {
            setError('Project name is required');
            return;
        }
        if (!editedTeam.projectDescription.trim()) {
            setError('Project description is required');
            return;
        }

        try {
            setLoading(true);
            await updateDoc(doc(db, 'teams', teamId), {
                name: editedTeam.name.trim(),
                projectName: editedTeam.projectName.trim(),
                projectDescription: editedTeam.projectDescription.trim(),
                updatedAt: serverTimestamp()
            });

            await fetchTeamData();
            setIsEditing(false);
            setError('');
        } catch (error) {
            console.error('Error updating team:', error);
            setError('Failed to update team details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMembers = async () => {
        if (selectedNewMembers.length === 0) {
            setError('Please select at least one member to add');
            return;
        }

        try {
            setLoading(true);
            setError('');

            // Update team document with new members
            const updatedMembers = [...team.members, ...selectedNewMembers];
            await updateDoc(doc(db, 'teams', teamId), {
                members: updatedMembers
            });

            // Update new members' user docs
            for (const memberId of selectedNewMembers) {
                const memberRef = doc(db, 'users', memberId);
                await updateDoc(memberRef, {
                    teams: [teamId],
                    teamId: teamId
                });
            }

            await fetchTeamData();
            setShowMemberManagement(false);
            setSelectedNewMembers([]);
            setError('');
        } catch (error) {
            console.error('Error adding members:', error);
            setError('Failed to add members');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;

        try {
            setLoading(true);
            setError('');

            // Update team document
            const updatedMembers = team.members.filter(id => id !== memberId);
            await updateDoc(doc(db, 'teams', teamId), {
                members: updatedMembers
            });

            // Update removed member's user doc
            const memberRef = doc(db, 'users', memberId);
            await updateDoc(memberRef, {
                teams: [],
                teamId: null
            });

            await fetchTeamData();
            setError('');
        } catch (error) {
            console.error('Error removing member:', error);
            setError('Failed to remove member');
        } finally {
            setLoading(false);
        }
    };

    const fetchTeamData = async () => {
        setLoading(true);
        setError('');
        try {
            const teamDoc = await getDoc(doc(db, 'teams', teamId));
            if (!teamDoc.exists()) throw new Error('Team not found');
            const teamData = { id: teamDoc.id, ...teamDoc.data() };
            setTeam(teamData);

            // Fetch tasks
            const tasksSnapshot = await getDocs(query(collection(db, 'teams', teamId, 'tasks'), orderBy('createdAt', 'asc')));
            let fetchedTasks = [];
            let migrated = false;
            for (const docSnap of tasksSnapshot.docs) {
                let task = { id: docSnap.id, ...docSnap.data() };
                if (task.sprintNumber === undefined) {
                    // Migrate: add sprintNumber: 1
                    await updateDoc(doc(db, 'teams', teamId, 'tasks', docSnap.id), { sprintNumber: 1 });
                    task.sprintNumber = 1;
                    migrated = true;
                }
                fetchedTasks.push(task);
            }
            setTasks(fetchedTasks);
            if (migrated) {
                // Optionally, refetch to ensure latest state
                // (not strictly necessary, but ensures state is up to date)
                // const tasksSnapshot2 = await getDocs(query(collection(db, 'teams', teamId, 'tasks'), orderBy('createdAt', 'asc')));
                // setTasks(tasksSnapshot2.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
            }

            // Fetch team members' details
            const members = [];
            const memberPromises = teamData.members
                .filter(memberId => memberId !== teamData.leaderId) // Exclude leader from members list
                .map(async (memberId) => {
                    const memberDoc = await getDoc(doc(db, 'users', memberId));
                    if (memberDoc.exists()) {
                        members.push({ id: memberId, ...memberDoc.data() });
                    }
                });

            // Fetch team leader details
            const leaderDoc = await getDoc(doc(db, 'users', teamData.leaderId));
            if (leaderDoc.exists()) {
                members.push({ id: teamData.leaderId, ...leaderDoc.data(), isLeader: true });
            }

            await Promise.all(memberPromises);
            setTeamMembers(members);

            // Fetch files from subcollection
            const filesRef = collection(db, 'teams', teamId, 'files');
            const filesQuery = query(filesRef, orderBy('uploadedAt', 'desc'));
            const filesSnap = await getDocs(filesQuery);
            const filesData = filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setFiles(filesData);
        } catch (error) {
            setError('Failed to fetch team data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (!newTask.title.trim() || !newTask.assignedTo) {
            setError('Please fill in all task details');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const sprintNumber = newTask.sprintNumber || 1;
            await addDoc(collection(db, 'teams', teamId, 'tasks'), {
                title: newTask.title.trim(),
                description: newTask.description.trim(),
                assignedTo: newTask.assignedTo,
                assignedBy: currentUser.email,
                status: 'todo',
                createdAt: serverTimestamp(),
                sprintNumber,
            });
            setShowTaskForm(false);
            setNewTask({ title: '', description: '', assignedTo: '', sprintNumber: 1 });
            await fetchTeamData();
        } catch (error) {
            setError('Failed to create task: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (taskId, newStatus) => {
        if (newStatus === 'ongoing') {
            setSelectedTask(tasks.find(t => t.id === taskId));
            setShowStatusUpdateModal(true);
            return;
        }

        try {
            const task = tasks.find(t => t.id === taskId);
            if (!task) {
                setError('Task not found');
                return;
            }

            // Check permissions
            const canUpdateTask = isTeamLeader || isTeacher || task.assignedTo === currentUser.email;
            if (!canUpdateTask) {
                setError("You don't have permission to update this task's status");
                return;
            }

            setLoading(true);
            const taskRef = doc(db, 'teams', teamId, 'tasks', taskId);
            const updateData = {
                status: newStatus,
                ...(newStatus === 'completed' ? { completedAt: new Date() } : {})
            };
            await updateDoc(taskRef, updateData);
            fetchTeamData(); // Refresh team data
            setError(''); // Clear any previous errors
        } catch (error) {
            console.error('Error updating task status:', error);
            setError('Failed to update task status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitStatusUpdate = async () => {
        if (!statusUpdate.trim()) {
            setError('Please provide details about the work done');
            return;
        }

        try {
            setLoading(true);
            const taskRef = doc(db, 'teams', teamId, 'tasks', selectedTask.id);
            const updateData = {
                status: 'ongoing',
                statusUpdates: [...(selectedTask.statusUpdates || []), {
                    update: statusUpdate.trim(),
                    updatedBy: currentUser.email,
                    updatedAt: new Date()
                }]
            };
            await updateDoc(taskRef, updateData);
            await fetchTeamData();
            setShowStatusUpdateModal(false);
            setStatusUpdate('');
            setSelectedTask(null);
            setError('');
        } catch (error) {
            console.error('Error updating task status:', error);
            setError('Failed to update task status. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFile = async (fileId, publicId) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;

        try {
            setLoading(true);
            setError(null);

            // Delete from Cloudinary
            const response = await fetch(`https://api.cloudinary.com/v1_1/dygizq4u0/delete_by_token`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ public_id: publicId }),
            });

            if (!response.ok) {
                throw new Error("Failed to delete file from Cloudinary");
            }

            // Delete from Firestore
            await deleteDoc(doc(db, 'teams', teamId, 'files', fileId));

            // Update local state
            setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
        } catch (error) {
            console.error('Error deleting file:', error);
            setError('Failed to delete file: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRepoLink = async () => {
        if (!repoLink.trim()) return;

        try {
            await updateDoc(doc(db, 'teams', teamId), {
                githubRepo: repoLink.trim()
            });
            setIsEditingRepo(false);
            await fetchTeamData();
        } catch (error) {
            console.error('Error updating repository link:', error);
            setError('Failed to update repository link');
        }
    };

    const getGanttData = () => {
        const data = [
            [
                { type: 'string', label: 'Task ID' },
                { type: 'string', label: 'Task Name' },
                { type: 'string', label: 'Resource' },
                { type: 'date', label: 'Start Date' },
                { type: 'date', label: 'End Date' },
                { type: 'number', label: 'Duration' },
                { type: 'number', label: 'Percent Complete' },
                { type: 'string', label: 'Dependencies' }
            ],
            ...tasks.map(task => {
                const startDate = task.createdAt?.toDate() || new Date();
                const endDate = task.completedAt?.toDate() || new Date();

                // Calculate duration based on task status
                let duration = 1; // Default duration for unstarted tasks
                if (task.status === 'ongoing') {
                    duration = Math.ceil((new Date() - startDate) / (1000 * 60 * 60 * 24));
                } else if (task.status === 'completed') {
                    duration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
                }

                // Calculate progress based on status
                let progress = 0;
                if (task.status === 'completed') {
                    progress = 100;
                } else if (task.status === 'ongoing') {
                    progress = 50;
                }

                return [
                    task.id,
                    task.title,
                    task.assignedTo,
                    startDate,
                    endDate,
                    duration,
                    progress,
                    null
                ];
            })
        ];
        return data;
    };

    const handleAddUpdate = (task) => {
        setSelectedTask(task);
        setShowStatusUpdateModal(true);
    };

    const renderSprintTasks = () => (
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-200">
            <h3 className="text-2xl font-bold mb-8 text-blue-800 flex items-center gap-2">
                <svg className="h-7 w-7 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v5a2 2 0 002 2h4a2 2 0 002-2v-5c0-2.21-1.79-4-4-4z" /></svg>
                Sprints
            </h3>
            <div className="space-y-6">
                {SPRINTS.map(sprint => {
                    const isExpanded = expandedSprint === sprint.number;
                    const sprintTasks = tasks.filter(task => task.sprintNumber === sprint.number);
                    const tasksByStatus = {
                        todo: sprintTasks.filter(task => task.status === 'todo'),
                        ongoing: sprintTasks.filter(task => task.status === 'ongoing'),
                        completed: sprintTasks.filter(task => task.status === 'completed'),
                    };
                    return (
                        <div key={sprint.number} className={`transition-shadow duration-200 border rounded-xl shadow ${isExpanded ? 'bg-white border-blue-400 shadow-lg' : 'bg-gray-50 border-gray-200'}`}>
                            <button
                                className={`w-full text-left px-6 py-4 font-semibold flex justify-between items-center focus:outline-none transition-all duration-200 ${isExpanded ? 'rounded-t-xl bg-blue-50 text-blue-900' : 'rounded-xl text-blue-800 hover:bg-blue-50'}`}
                                onClick={() => setExpandedSprint(isExpanded ? null : sprint.number)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="inline-block bg-blue-100 text-blue-700 font-bold rounded-full px-4 py-1 text-xs">Sprint {sprint.number}</span>
                                    <span className="text-base md:text-lg font-semibold">{sprint.title}</span>
                                </div>
                                <span className="ml-2 text-lg">{isExpanded ? '▲' : '▼'}</span>
                            </button>
                            {isExpanded && (
                                <div className="p-6 bg-white border-t rounded-b-xl">
                                    <div className="mb-4 flex flex-col md:flex-row md:items-center md:gap-8">
                                        <div className="mb-2 md:mb-0">
                                            <span className="font-semibold text-blue-700">Goals:</span>
                                            <ul className="list-disc ml-6 text-gray-800 text-sm mt-1">
                                                {sprint.goals.map((goal, i) => <li key={i}>{goal}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="font-semibold text-green-700">Deliverables:</span>
                                            <ul className="list-disc ml-6 text-gray-800 text-sm mt-1">
                                                {sprint.deliverables.map((d, i) => <li key={i}>{d}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                    {(isTeamLeader || isTeacher) && (
                                        <button
                                            onClick={() => { setShowTaskForm(true); setNewTask({ ...newTask, sprintNumber: sprint.number }); }}
                                            className="mb-4 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 font-semibold transition-all"
                                        >
                                            + Create New Task
                                        </button>
                                    )}
                                    {showTaskForm && newTask.sprintNumber === sprint.number && (
                                        <form onSubmit={handleCreateTask} className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 shadow">
                                            <div className="space-y-4">
                                                <input
                                                    type="text"
                                                    placeholder="Task Title"
                                                    value={newTask.title}
                                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                />
                                                <textarea
                                                    placeholder="Task Description"
                                                    value={newTask.description}
                                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                                    className="w-full p-2 border rounded h-24"
                                                    required
                                                />
                                                <select
                                                    value={newTask.assignedTo}
                                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                                    className="w-full p-2 border rounded"
                                                    required
                                                >
                                                    <option value="">Assign To</option>
                                                    {teamMembers.map(member => (
                                                        <option key={member.id} value={member.email}>
                                                            {member.name || member.email}
                                                        </option>
                                                    ))}
                                                </select>
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setShowTaskForm(false); setNewTask({ title: '', description: '', assignedTo: '', sprintNumber: sprint.number }); }}
                                                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                                                        disabled={loading}
                                                    >
                                                        {loading ? 'Creating...' : 'Create Task'}
                                                    </button>
                                                </div>
                                            </div>
                                        </form>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
                                            <div key={status} className={`p-4 rounded-lg border ${status === 'todo' ? 'bg-yellow-50 border-yellow-200' : status === 'ongoing' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                                                <h4 className={`font-semibold mb-3 capitalize ${status === 'todo' ? 'text-yellow-700' : status === 'ongoing' ? 'text-blue-700' : 'text-green-700'}`}>{status} ({statusTasks.length})</h4>
                                                <div className="space-y-2">
                                                    {statusTasks.map(task => {
                                                        const canUpdateThisTask = isTeamLeader || isTeacher || task.assignedTo === currentUser.email;
                                                        const isOpen = openTaskId === task.id;
                                                        return (
                                                            <div key={task.id} className="bg-white rounded shadow-sm mb-2">
                                                                <button
                                                                    className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-100 focus:outline-none"
                                                                    onClick={() => setOpenTaskId(isOpen ? null : task.id)}
                                                                >
                                                                    <span className="font-medium truncate max-w-xs">{task.title}</span>
                                                                    <span className="ml-2">{isOpen ? '▲' : '▼'}</span>
                                                                </button>
                                                                {isOpen && (
                                                                    <div className="p-3 border-t">
                                                                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                                                        <div className="text-xs text-gray-500 mt-2">
                                                                            <p>Assigned to: {task.assignedTo}</p>
                                                                            <p>Created by: {task.assignedBy}</p>
                                                                            <p>Created: {task.createdAt?.toDate().toLocaleDateString()}</p>
                                                                        </div>
                                                                        {canUpdateThisTask && (
                                                                            <div className="mt-2 flex gap-2 justify-end">
                                                                                {status === 'todo' && (
                                                                                    <button
                                                                                        onClick={() => handleStatusUpdate(task.id, 'ongoing')}
                                                                                        className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded w-24 hover:bg-yellow-600 transition-colors"
                                                                                    >
                                                                                        Move to Ongoing
                                                                                    </button>
                                                                                )}
                                                                                {status === 'ongoing' && (
                                                                                    <>
                                                                                        <button
                                                                                            onClick={() => handleStatusUpdate(task.id, 'completed')}
                                                                                            className="text-xs bg-green-500 text-white px-3 py-1.5 rounded w-24 hover:bg-green-600 transition-colors"
                                                                                        >
                                                                                            Mark Complete
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() => handleStatusUpdate(task.id, 'todo')}
                                                                                            className="text-xs bg-gray-500 text-white px-3 py-1.5 rounded w-24 hover:bg-gray-600 transition-colors"
                                                                                        >
                                                                                            Move to Todo
                                                                                        </button>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {/* Work Updates Section for Ongoing Tasks as dropdown */}
                                                                        {task.status === 'ongoing' && (
                                                                            <details className="mt-2">
                                                                                <summary className="cursor-pointer text-sm font-semibold text-gray-700">Work Updates</summary>
                                                                                <div className="pt-2">
                                                                                    <div className="flex justify-between items-center mb-2">
                                                                                        <span className="text-xs font-semibold text-gray-700">Updates:</span>
                                                                                        {canUpdateThisTask && (
                                                                                            <button
                                                                                                onClick={() => handleAddUpdate(task)}
                                                                                                className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                                                                                            >
                                                                                                Add Update
                                                                                            </button>
                                                                                        )}
                                                                                    </div>
                                                                                    {task.statusUpdates && task.statusUpdates.length > 0 ? (
                                                                                        <div className="space-y-1 mt-1">
                                                                                            {task.statusUpdates.map((update, index) => (
                                                                                                <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                                                                                                    <p className="text-gray-600">{update.update}</p>
                                                                                                    <p className="text-gray-400 text-xs mt-1">
                                                                                                        By {update.updatedBy} on {update.updatedAt ? (update.updatedAt.seconds ? new Date(update.updatedAt.seconds * 1000).toLocaleString() : new Date(update.updatedAt).toLocaleString()) : ''}
                                                                                                    </p>
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <p className="text-xs text-gray-500">No updates yet</p>
                                                                                    )}
                                                                                </div>
                                                                            </details>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setUploadingFile(true);
            setError(null);

            // Create form data for file upload
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', 'team_files'); // Replace with your Cloudinary upload preset

            // Upload to Cloudinary
            const response = await fetch('https://api.cloudinary.com/v1_1/dygizq4u0/auto/upload', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error("Failed to upload file");
            }

            const data = await response.json();

            // Add file record to Firestore
            const fileData = {
                fileName: file.name,
                fileType: file.name.split('.').pop().toLowerCase(),
                fileURL: data.secure_url,
                publicId: data.public_id,
                uploadedBy: currentUser.email,
                uploadedAt: serverTimestamp(),
                description: ''
            };

            await addDoc(collection(db, 'teams', teamId, 'files'), fileData);
            await fetchTeamData(); // Refresh files list
            event.target.value = ''; // Reset file input
        } catch (error) {
            console.error('Error uploading file:', error);
            setError('Failed to upload file: ' + error.message);
        } finally {
            setUploadingFile(false);
        }
    };

    const handleDeleteTeam = async () => {
        if (!window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

        try {
            setLoading(true);
            setError('');

            // Get all team members including leader
            const allMembers = [...team.members, team.leaderId];

            // Update all team members' user docs to remove team references
            for (const memberId of allMembers) {
                const memberRef = doc(db, 'users', memberId);
                await updateDoc(memberRef, {
                    teams: [],
                    teamId: null
                });
            }

            // Delete team document
            await deleteDoc(doc(db, 'teams', teamId));

            // Navigate to teams page
            navigate('/teams');
        } catch (error) {
            console.error('Error deleting team:', error);
            setError('Failed to delete team');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="min-h-screen p-6 bg-gray-100">
                <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold mb-4">Team Details</h2>
                    <p>No team data available.</p>
                </div>
            </div>
        );
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
                <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
                    {/* Team Header */}
                    <div className="w-full flex flex-col items-center mb-8">
                        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 animate-fade-in-up border-2 border-indigo-200">
                            <span className="text-2xl text-white drop-shadow-lg">
                                <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='white' className='w-7 h-7'>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M2.25 18.75a6.75 6.75 0 0113.5 0M12 6.75a3 3 0 11-6 0 3 3 0 016 0zm8.25 12v-2.25A2.25 2.25 0 0018 14.25h-1.5m2.25 4.5v-2.25c0-.414-.336-.75-.75-.75h-1.5c-.414 0-.75.336-.75.75v2.25m2.25 0h-2.25' />
                                </svg>
                            </span>
                            <span className="text-xl font-bold text-white tracking-tight">
                                {team?.name}
                            </span>
                        </div>
                        {team?.description && (
                            <span className="mt-2 text-base text-indigo-700 font-medium text-center max-w-2xl">
                                {team.description}
                            </span>
                        )}
                    </div>

                    {/* Main Content Tabs */}
                    <div className="bg-white/70 shadow-lg rounded-2xl border border-purple-100">
                        {/* Tab Navigation */}
                        <div className="border-b border-purple-200 bg-gradient-to-r from-purple-100/60 to-blue-100/60 rounded-t-2xl px-6 pt-4 shadow-sm">
                            <nav className="-mb-px flex space-x-8">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`${activeTab === 'details'
                                        ? 'relative bg-white text-purple-700 font-bold shadow-md rounded-xl -mt-4 py-3 px-7 border-b-4 border-purple-500 transition-all duration-200'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-white/60 font-medium rounded-xl py-3 px-7 transition-all duration-200'} flex items-center justify-center`}
                                >
                                    Team Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('tasks')}
                                    className={`${activeTab === 'tasks'
                                        ? 'relative bg-white text-purple-700 font-bold shadow-md rounded-xl -mt-4 py-3 px-7 border-b-4 border-purple-500 transition-all duration-200'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-white/60 font-medium rounded-xl py-3 px-7 transition-all duration-200'} flex items-center justify-center`}
                                >
                                    Tasks
                                </button>
                                <button
                                    onClick={() => setActiveTab('files')}
                                    className={`${activeTab === 'files'
                                        ? 'relative bg-white text-purple-700 font-bold shadow-md rounded-xl -mt-4 py-3 px-7 border-b-4 border-purple-500 transition-all duration-200'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-white/60 font-medium rounded-xl py-3 px-7 transition-all duration-200'} flex items-center justify-center`}
                                >
                                    Files Shared
                                </button>
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`${activeTab === 'chat'
                                        ? 'relative bg-white text-purple-700 font-bold shadow-md rounded-xl -mt-4 py-3 px-7 border-b-4 border-purple-500 transition-all duration-200'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-white/60 font-medium rounded-xl py-3 px-7 transition-all duration-200'} flex items-center justify-center`}
                                >
                                    Team Chat
                                </button>
                                {isTeacher && (
                                    <button
                                        onClick={() => setActiveTab('report')}
                                        className={`${activeTab === 'report'
                                            ? 'relative bg-white text-purple-700 font-bold shadow-md rounded-xl -mt-4 py-3 px-7 border-b-4 border-purple-500 transition-all duration-200'
                                            : 'text-gray-600 hover:text-purple-600 hover:bg-white/60 font-medium rounded-xl py-3 px-7 transition-all duration-200'} flex items-center justify-center`}
                                    >
                                        Report
                                    </button>
                                )}
                            </nav>
                        </div>

                        <div className="p-8">
                            {activeTab === 'details' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left Column: Team Info and Members */}
                                    <div className="lg:col-span-1">
                                        <div className="bg-white rounded-2xl shadow-lg p-0 mb-6 border border-purple-100 overflow-hidden">
                                            <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-500">
                                                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                <h2 className="text-lg font-bold text-white tracking-tight">Team Details</h2>
                                                <div className="flex-1"></div>
                                                <div className="flex items-center gap-2">
                                                    {(isTeamLeader || isTeacher) && (
                                                        <button
                                                            onClick={() => setIsEditing(!isEditing)}
                                                            className="text-white bg-purple-700 hover:bg-purple-800 rounded-lg px-3 py-1 font-semibold shadow transition"
                                                        >
                                                            {isEditing ? 'Cancel' : 'Edit'}
                                                        </button>
                                                    )}
                                                    {isTeamLeader && (
                                                        <button
                                                            onClick={handleDeleteTeam}
                                                            className="text-white bg-red-600 hover:bg-red-700 rounded-lg px-3 py-1 font-semibold shadow transition"
                                                        >
                                                            Delete Team
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="px-6 py-5">
                                                {isEditing ? (
                                                    <form onSubmit={(e) => { e.preventDefault(); handleUpdateTeam(); }} className="space-y-4">
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700">Team Name</label>
                                                            <input
                                                                type="text"
                                                                value={editedTeam.name}
                                                                onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700">Project Name</label>
                                                            <input
                                                                type="text"
                                                                value={editedTeam.projectName}
                                                                onChange={(e) => setEditedTeam({ ...editedTeam, projectName: e.target.value })}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-semibold text-gray-700">Project Description</label>
                                                            <textarea
                                                                value={editedTeam.projectDescription}
                                                                onChange={(e) => setEditedTeam({ ...editedTeam, projectDescription: e.target.value })}
                                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                                                                rows="4"
                                                                required
                                                            />
                                                        </div>
                                                        <button
                                                            type="submit"
                                                            className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-semibold shadow"
                                                        >
                                                            Save Changes
                                                        </button>
                                                    </form>
                                                ) : (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-3-3v6m-7 4a4 4 0 018 0" /></svg>
                                                                Project Name
                                                            </h3>
                                                            <p className="text-gray-700 text-base font-medium pl-1 border-l-4 border-gray-300 bg-gray-50 rounded-r-lg mt-1">{team.projectName}</p>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                                                <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                                                Project Description
                                                            </h3>
                                                            <p className="text-gray-700 pl-1 border-l-4 border-gray-300 bg-gray-50 rounded-r-lg mt-1">{team.projectDescription}</p>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-sm font-semibold text-gray-500">Created On</h3>
                                                            <p className="text-gray-600">
                                                                {new Date(team.createdAt.seconds * 1000).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xl font-semibold flex items-center gap-2">
                                                    <svg className="h-6 w-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                    Team Members
                                                </h3>
                                                {(isTeamLeader || isTeacher) && (
                                                    <button
                                                        onClick={() => {
                                                            setShowMemberManagement(!showMemberManagement);
                                                            if (!showMemberManagement) fetchAvailableUsers();
                                                        }}
                                                        className="inline-flex items-center gap-1 px-4 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition shadow-sm border border-gray-200"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                                        {showMemberManagement ? 'Cancel' : 'Manage'}
                                                    </button>
                                                )}
                                            </div>
                                            {showMemberManagement ? (
                                                <div className="space-y-4">
                                                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2 bg-gray-50">
                                                        {availableUsers.length === 0 ? (
                                                            <p className="text-gray-500 text-sm">No available users to add</p>
                                                        ) : (
                                                            availableUsers.map(user => (
                                                                <label key={user.uid} className="flex items-center space-x-2 mb-2 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedNewMembers.includes(user.uid)}
                                                                        onChange={e => {
                                                                            if (e.target.checked) setSelectedNewMembers([...selectedNewMembers, user.uid]);
                                                                            else setSelectedNewMembers(selectedNewMembers.filter(id => id !== user.uid));
                                                                        }}
                                                                        className="rounded text-gray-600 focus:ring-gray-500"
                                                                    />
                                                                    <span className="inline-flex items-center gap-2">
                                                                        <span className="inline-block h-6 w-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-xs">
                                                                            {user.name ? user.name.charAt(0).toUpperCase() : (user.email ? user.email.charAt(0).toUpperCase() : '?')}
                                                                        </span>
                                                                        <span className="text-sm font-medium">{user.name || user.email}</span>
                                                                    </span>
                                                                </label>
                                                            ))
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={handleAddMembers}
                                                        className="w-full bg-gray-800 text-white py-2 px-4 rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 font-semibold shadow"
                                                    >
                                                        Add Selected Members
                                                    </button>
                                                </div>
                                            ) : (
                                                <ul className="space-y-2 max-h-56 overflow-y-auto pr-2">
                                                    {teamMembers.map((member) => (
                                                        <li key={member.id} className="bg-gray-50 rounded p-3 flex flex-col items-start group hover:bg-gray-100 transition border border-gray-200">
                                                            <div className="flex items-center space-x-3 w-full">
                                                                <span className="inline-block h-8 w-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-base">
                                                                    {member.name ? member.name.charAt(0).toUpperCase() : (member.email ? member.email.charAt(0).toUpperCase() : '?')}
                                                                </span>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="text-gray-700 font-medium break-words">{member.name || member.email}</span>
                                                                        <span className={`text-xs px-2 py-1 rounded ${member.isLeader ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{member.isLeader ? 'Team Leader' : 'Team Member'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {(isTeamLeader || isTeacher) && !member.isLeader && (
                                                                <button
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                    className="flex items-center gap-1 mt-2 px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 font-semibold text-sm shadow transition group-hover:opacity-100 opacity-90 self-start"
                                                                    title="Remove Member"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    Remove
                                                                </button>
                                                            )}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Middle Column: Repository and Progress */}
                                    <div className="lg:col-span-2">
                                        {/* Repository Link Section */}
                                        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                                            <h3 className="text-xl font-semibold">Repository Link</h3>
                                            {isEditingRepo ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={repoLink}
                                                        onChange={(e) => setRepoLink(e.target.value)}
                                                        placeholder="Enter GitHub repository URL"
                                                        className="flex-1 p-2 border rounded"
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            handleUpdateRepoLink();
                                                            setIsEditingRepo(false);
                                                        }}
                                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => setIsEditingRepo(false)}
                                                        className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {repoLink ? (
                                                        <a
                                                            href={repoLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:text-blue-600 hover:underline"
                                                        >
                                                            {repoLink}
                                                        </a>
                                                    ) : (
                                                        <span className="text-gray-500">No repository link added</span>
                                                    )}
                                                    {isTeamLeader && (
                                                        <button
                                                            onClick={() => setIsEditingRepo(true)}
                                                            className="text-gray-500 hover:text-gray-700"
                                                        >
                                                            ✏️
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Project Progress Chart */}
                                        <ProjectProgressChart tasks={tasks} team={team} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'files' && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-semibold">Shared Files</h3>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                className="hidden"
                                                id="fileInput"
                                                disabled={uploadingFile}
                                            />
                                            <label
                                                htmlFor="fileInput"
                                                className={`cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 ${uploadingFile ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {uploadingFile ? 'Uploading...' : 'Upload File'}
                                            </label>
                                        </div>
                                    </div>
                                    {files.length > 0 ? (
                                        <div className="space-y-2">
                                            {files.map((file) => (
                                                <FileItem
                                                    key={file.id}
                                                    file={file}
                                                    team={team}
                                                    onDelete={handleDeleteFile}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500">No files uploaded yet.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && (
                                <>
                                    {/* Task View Tabs */}
                                    <div className="mb-6 border-b border-gray-200">
                                        <nav className="-mb-px flex space-x-8">
                                            <button
                                                onClick={() => setTaskView('cards')}
                                                className={`${taskView === 'cards'
                                                    ? 'border-purple-500 text-purple-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                            >
                                                Task Cards
                                            </button>
                                            <button
                                                onClick={() => setTaskView('gantt')}
                                                className={`${taskView === 'gantt'
                                                    ? 'border-purple-500 text-purple-600'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                                            >
                                                Gantt Chart
                                            </button>
                                        </nav>
                                    </div>

                                    {/* Task View Content */}
                                    {taskView === 'cards' ? (
                                        renderSprintTasks()
                                    ) : (
                                        <div className="bg-white rounded-lg shadow-md p-6">
                                            <h3 className="text-xl font-semibold mb-4">Task Timeline (Gantt Chart)</h3>
                                            <div className="h-[500px]">
                                                <Chart
                                                    width={'100%'}
                                                    height={'100%'}
                                                    chartType="Gantt"
                                                    loader={<div className="flex items-center justify-center h-full">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                                    </div>}
                                                    data={getGanttData()}
                                                    options={{
                                                        height: 500,
                                                        gantt: {
                                                            trackHeight: 30,
                                                            barHeight: 20,
                                                            criticalPathEnabled: true,
                                                            criticalPathStyle: {
                                                                stroke: '#ff0000',
                                                                strokeWidth: 2
                                                            },
                                                            innerGridTrack: { fill: '#f0f0f0' },
                                                            innerGridDarkTrack: { fill: '#e0e0e0' },
                                                            labelStyle: {
                                                                fontName: 'Arial',
                                                                fontSize: 14,
                                                                color: '#333'
                                                            },
                                                            percentEnabled: true,
                                                            percentStyle: {
                                                                fill: '#4CAF50'
                                                            }
                                                        },
                                                        backgroundColor: {
                                                            fill: '#ffffff'
                                                        },
                                                        chartArea: {
                                                            left: '10%',
                                                            top: '10%',
                                                            width: '80%',
                                                            height: '80%'
                                                        },
                                                        hAxis: {
                                                            format: 'MMM d, yyyy',
                                                            gridlines: {
                                                                color: '#f0f0f0'
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'chat' && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <TeamChat teamId={teamId} />
                                </div>
                            )}

                            {activeTab === 'report' && (
                                <div className="bg-white rounded-lg shadow-md p-6">
                                    <ReportMaker
                                        tasks={tasks}
                                        teamMembers={teamMembers}
                                        teamName={team.name}
                                        teamId={teamId}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {showStatusUpdateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                        <h3 className="text-xl font-semibold mb-4">Update Task Status</h3>
                        <p className="text-gray-600 mb-4">
                            Please provide details about the work you've done on this task. This will help other team members understand the progress.
                        </p>
                        <textarea
                            value={statusUpdate}
                            onChange={(e) => setStatusUpdate(e.target.value)}
                            placeholder="Describe the work you've done..."
                            className="w-full p-2 border rounded-lg mb-4 h-32"
                            required
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowStatusUpdateModal(false);
                                    setStatusUpdate('');
                                    setSelectedTask(null);
                                }}
                                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmitStatusUpdate}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                disabled={loading}
                            >
                                {loading ? 'Updating...' : 'Update Status'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DndProvider>
    );
};

export default TeamDetails;