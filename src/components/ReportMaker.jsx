// Updated ReportMaker.jsx with ISE1, ISE2, and PBL Evaluation Rubrics Integration
import React, { useState, useRef, useEffect } from "react";
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

ChartJS.register(ArcElement, Tooltip, Legend);

const RUBRICS = {
    ISE1: [
        { criteria: "Problem Statement & Objectives", weight: 20 },
        { criteria: "Requirement Analysis", weight: 20 },
        { criteria: "System Design", weight: 25 },
        { criteria: "Project Planning", weight: 15 },
        { criteria: "Initial Development", weight: 20 },
    ],
    ISE2: [
        { criteria: "System Functionality", weight: 30 },
        { criteria: "Testing & debugging", weight: 20 },
        { criteria: "Documentation", weight: 20 },
        { criteria: "Presentation & Demonstration", weight: 20 },
        { criteria: "Teamwork & Collaboration", weight: 10 },
    ],
    PBLQ: [
        { criteria: "Innovation and Originality", weight: 20 },
        { criteria: "System Functionality", weight: 25 },
        { criteria: "Technical Complexity", weight: 20 },
        { criteria: "Presentation and Demonstration", weight: 15 },
        { criteria: "Testing and Reliability", weight: 10 },
        { criteria: "Documentation", weight: 10 },
    ]
};

const ScoreForm = ({ title, rubric, scores, setScores, onSave, loading, evaluationType }) => (
    <div className="bg-white rounded-lg p-6 shadow">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold">{title} Evaluation</h4>
            <button
                onClick={() => onSave(evaluationType, scores)}
                disabled={loading}
                className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50"
            >
                {loading ? 'Saving...' : 'Save Marks'}
            </button>
        </div>
        <div className="space-y-4">
            {rubric.map(({ criteria, weight }) => (
                <div key={criteria} className="flex justify-between items-center">
                    <div className="w-2/3">
                        <p className="font-medium">{criteria} ({weight}%)</p>
                    </div>
                    <input
                        type="number"
                        min="0"
                        max="10"
                        value={scores[criteria] || ''}
                        onChange={(e) => {
                            const value = Math.min(10, Math.max(0, Number(e.target.value)));
                            setScores(prev => ({ ...prev, [criteria]: value }));
                        }}
                        className="w-20 border border-gray-300 rounded p-1"
                        placeholder="/10"
                    />
                </div>
            ))}
        </div>
    </div>
);

const calculateTotal = (rubric, scores) => {
    return rubric.reduce((total, { criteria, weight }) => {
        const score = parseFloat(scores[criteria] || 0);
        return total + (score * weight) / 10;
    }, 0);
};

const TaskProgressChart = ({ tasks }) => {
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const ongoingTasks = tasks.filter(t => t.status === 'ongoing').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;

    const data = {
        labels: ['Completed', 'Ongoing', 'To Do'],
        datasets: [
            {
                data: [completedTasks, ongoingTasks, todoTasks],
                backgroundColor: ['#4CAF50', '#FFC107', '#9E9E9E'],
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
            },
            title: {
                display: true,
                text: 'Task Progress Distribution',
                font: {
                    size: 16,
                },
            },
        },
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow">
            <h4 className="text-lg font-semibold mb-4">Task Progress</h4>
            <div className="h-64">
                <Pie data={data} options={options} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div>
                    <div className="text-2xl font-bold text-green-500">{completedTasks}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-yellow-500">{ongoingTasks}</div>
                    <div className="text-sm text-gray-600">In Progress</div>
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-500">{todoTasks}</div>
                    <div className="text-sm text-gray-600">To Do</div>
                </div>
            </div>
        </div>
    );
};

const TeamMemberStats = ({ tasks, teamMembers }) => {
    const memberStats = teamMembers.map(member => {
        const memberTasks = tasks.filter(task => task.assignedTo === member.email);
        const completedTasks = memberTasks.filter(task => task.status === 'completed').length;
        const ongoingTasks = memberTasks.filter(task => task.status === 'ongoing').length;
        const todoTasks = memberTasks.filter(task => task.status === 'todo').length;

        return {
            name: member.name,
            email: member.email,
            totalTasks: memberTasks.length,
            completedTasks,
            ongoingTasks,
            todoTasks,
            completionRate: memberTasks.length > 0 ? (completedTasks / memberTasks.length) * 100 : 0
        };
    });

    return (
        <div className="bg-white rounded-lg p-6 shadow">
            <h4 className="text-lg font-semibold mb-4">Team Member Contributions</h4>
            <div className="space-y-4">
                {memberStats.map(stat => (
                    <div key={stat.email} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <p className="font-medium">{stat.name}</p>
                                <p className="text-sm text-gray-600">{stat.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold text-purple-600">
                                    {stat.completionRate.toFixed(1)}%
                                </p>
                                <p className="text-sm text-gray-600">Completion Rate</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-green-500">{stat.completedTasks}</p>
                                <p className="text-sm text-gray-600">Completed</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-yellow-500">{stat.ongoingTasks}</p>
                                <p className="text-sm text-gray-600">In Progress</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-500">{stat.todoTasks}</p>
                                <p className="text-sm text-gray-600">To Do</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ReportMaker = ({ tasks, teamMembers, teamName, teamId }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ise1Scores, setIse1Scores] = useState({});
    const [ise2Scores, setIse2Scores] = useState({});
    const [pblqScores, setPblqScores] = useState({});
    const [saveSuccess, setSaveSuccess] = useState('');
    const [loadingStates, setLoadingStates] = useState({
        ise1: false,
        ise2: false,
        pblq: false
    });
    const reportRef = useRef();

    // Load saved marks when component mounts
    useEffect(() => {
        const loadSavedMarks = async () => {
            try {
                setLoading(true);
                setError(null);

                // Initialize scores with 0 for all criteria
                const initializeScores = (rubric) => {
                    return rubric.reduce((acc, { criteria }) => {
                        acc[criteria] = 0;
                        return acc;
                    }, {});
                };

                // Set initial scores to 0
                setIse1Scores(initializeScores(RUBRICS.ISE1));
                setIse2Scores(initializeScores(RUBRICS.ISE2));
                setPblqScores(initializeScores(RUBRICS.PBLQ));

                // Load ISE1 marks
                const ise1Promises = RUBRICS.ISE1.map(async ({ criteria }) => {
                    const docRef = doc(db, 'teams', teamId, 'ise1', criteria);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { criteria, score: docSnap.data().score };
                    }
                    // If document doesn't exist, create it with score 0
                    const marksData = {
                        score: 0,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: auth.currentUser.uid,
                        updatedByRole: 'teacher',
                        teamId: teamId
                    };
                    await setDoc(docRef, marksData);
                    return { criteria, score: 0 };
                });

                const ise1Results = await Promise.all(ise1Promises);
                const ise1Scores = ise1Results.reduce((acc, result) => {
                    if (result) {
                        acc[result.criteria] = result.score;
                    }
                    return acc;
                }, {});
                setIse1Scores(ise1Scores);

                // Load ISE2 marks
                const ise2Promises = RUBRICS.ISE2.map(async ({ criteria }) => {
                    const docRef = doc(db, 'teams', teamId, 'ise2', criteria);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { criteria, score: docSnap.data().score };
                    }
                    // If document doesn't exist, create it with score 0
                    const marksData = {
                        score: 0,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: auth.currentUser.uid,
                        updatedByRole: 'teacher',
                        teamId: teamId
                    };
                    await setDoc(docRef, marksData);
                    return { criteria, score: 0 };
                });

                const ise2Results = await Promise.all(ise2Promises);
                const ise2Scores = ise2Results.reduce((acc, result) => {
                    if (result) {
                        acc[result.criteria] = result.score;
                    }
                    return acc;
                }, {});
                setIse2Scores(ise2Scores);

                // Load PBLQ marks
                const pblqPromises = RUBRICS.PBLQ.map(async ({ criteria }) => {
                    const docRef = doc(db, 'teams', teamId, 'PBLQ', criteria);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        return { criteria, score: docSnap.data().score };
                    }
                    // If document doesn't exist, create it with score 0
                    const marksData = {
                        score: 0,
                        lastUpdated: new Date().toISOString(),
                        updatedBy: auth.currentUser.uid,
                        updatedByRole: 'teacher',
                        teamId: teamId
                    };
                    await setDoc(docRef, marksData);
                    return { criteria, score: 0 };
                });

                const pblqResults = await Promise.all(pblqPromises);
                const pblqScores = pblqResults.reduce((acc, result) => {
                    if (result) {
                        acc[result.criteria] = result.score;
                    }
                    return acc;
                }, {});
                setPblqScores(pblqScores);

            } catch (err) {
                console.error('Error loading saved marks:', err);
                if (err.code === 'permission-denied') {
                    setError('Permission denied. Only teachers can view marks.');
                } else {
                    setError('Failed to load saved marks. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (teamId) {
            loadSavedMarks();
        }
    }, [teamId]);

    const ise1Total = calculateTotal(RUBRICS.ISE1, ise1Scores);
    const ise2Total = calculateTotal(RUBRICS.ISE2, ise2Scores);
    const pblqTotal = calculateTotal(RUBRICS.PBLQ, pblqScores);

    const isPBLQualified = pblqTotal >= 70;

    const handleSaveMarks = async (evaluationType, scores) => {
        try {
            setLoadingStates(prev => ({ ...prev, [evaluationType]: true }));
            setError(null);

            // Verify user role
            const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (!userDoc.exists()) {
                setError('User document not found. Please try logging in again.');
                return;
            }

            const userData = userDoc.data();
            console.log('Current user role:', userData.role);
            console.log('Current user ID:', auth.currentUser.uid);

            if (userData.role !== 'teacher') {
                setError('Only teachers can save marks. Your current role is: ' + userData.role);
                return;
            }

            // Validate scores
            const validatedScores = {};
            let hasValidScores = false;

            // Get the appropriate rubric based on evaluation type
            const rubric = RUBRICS[evaluationType.toUpperCase()];

            // Validate each score
            rubric.forEach(({ criteria }) => {
                const score = scores[criteria];
                if (score !== undefined && score !== '') {
                    validatedScores[criteria] = Number(score);
                    hasValidScores = true;
                }
            });

            if (!hasValidScores) {
                setError('Please enter at least one score before saving.');
                return;
            }

            console.log(`Saving ${evaluationType} marks for team ${teamId}:`, validatedScores);
            console.log('Current user:', auth.currentUser.uid);

            // Save each component score separately
            const savePromises = Object.entries(validatedScores).map(async ([criteria, score]) => {
                const marksData = {
                    score: score,
                    lastUpdated: new Date().toISOString(),
                    updatedBy: auth.currentUser.uid,
                    updatedByRole: 'teacher',
                    teamId: teamId
                };

                const docRef = doc(db, 'teams', teamId, evaluationType, criteria);
                try {
                    await setDoc(docRef, marksData);
                    console.log(`Successfully saved ${criteria} score:`, score);
                } catch (err) {
                    console.error(`Error saving ${criteria} score:`, err);
                    console.error('Error details:', {
                        code: err.code,
                        message: err.message,
                        path: docRef.path,
                        userRole: userData.role,
                        userId: auth.currentUser.uid
                    });
                    throw err;
                }
            });

            await Promise.all(savePromises);
            setSaveSuccess(`${evaluationType} marks saved successfully!`);
            setTimeout(() => setSaveSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving marks:', err);
            if (err.code === 'permission-denied') {
                setError(`Permission denied. Only teachers can save marks. Error details: ${err.message}`);
            } else {
                setError(`Failed to save ${evaluationType} marks. Please try again. Error: ${err.message}`);
            }
        } finally {
            setLoadingStates(prev => ({ ...prev, [evaluationType]: false }));
        }
    };

    const generatePDF = async () => {
        try {
            setLoading(true);
            const input = reportRef.current;
            const canvas = await html2canvas(input, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Add title page
            pdf.setFontSize(24);
            pdf.text(teamName, pdfWidth / 2, 40, { align: 'center' });
            pdf.setFontSize(12);
            pdf.text(`Generated on: ${new Date().toLocaleString()}`, pdfWidth / 2, 50, { align: 'center' });
            pdf.addPage();

            // Add content
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
            pdf.save(`${teamName.replace(/\s+/g, '_')}_report.pdf`);
        } catch (err) {
            console.error('Error generating PDF:', err);
            setError('Failed to generate PDF. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const TaskDescription = ({ tasks, teamMembers }) => {
        const tasksByMember = teamMembers.map(member => ({
            ...member,
            tasks: tasks.filter(task => task.assignedTo === member.email)
        }));

        return (
            <div className="bg-white rounded-lg shadow p-6 max-h-96 overflow-y-auto">
                <h4 className="text-lg font-semibold mb-4">Detailed Task Descriptions</h4>
                <div className="space-y-6">
                    {tasksByMember.map(member => (
                        <div key={member.email} className="border-b pb-6 last:border-b-0">
                            <h5 className="text-md font-semibold mb-3">{member.name}</h5>
                            <div className="space-y-4">
                                {member.tasks.map(task => (
                                    <div key={task.id} className="bg-gray-50 p-4 rounded">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h6 className="font-medium">{task.title}</h6>
                                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs
                                                ${task.status === 'completed' ? 'bg-green-500 text-white' :
                                                    task.status === 'ongoing' ? 'bg-yellow-500 text-white' :
                                                        'bg-gray-500 text-white'}`}>
                                                {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                                            </span>
                                        </div>
                                        <div className="mt-2 text-sm text-gray-500">
                                            <p>Created: {task.createdAt?.toDate().toLocaleDateString()}</p>
                                            {task.completedAt && (
                                                <p>Completed: {task.completedAt.toDate().toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Team Progress Report</h3>
                <button
                    onClick={generatePDF}
                    disabled={loading}
                    className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Generating PDF...' : 'Download PDF Report'}
                </button>
            </div>

            {error && <div className="bg-red-100 text-red-700 p-2 rounded">{error}</div>}
            {saveSuccess && <div className="bg-green-100 text-green-700 p-2 rounded">{saveSuccess}</div>}

            <h2 className="text-2xl font-bold mt-6">{teamName}</h2>
            <p>Generated on: {new Date().toLocaleString()}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskProgressChart tasks={tasks} />
                <TeamMemberStats tasks={tasks} teamMembers={teamMembers} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ScoreForm
                    title="ISE 1"
                    rubric={RUBRICS.ISE1}
                    scores={ise1Scores}
                    setScores={setIse1Scores}
                    onSave={handleSaveMarks}
                    loading={loadingStates.ise1}
                    evaluationType="ise1"
                />
                <ScoreForm
                    title="ISE 2"
                    rubric={RUBRICS.ISE2}
                    scores={ise2Scores}
                    setScores={setIse2Scores}
                    onSave={handleSaveMarks}
                    loading={loadingStates.ise2}
                    evaluationType="ise2"
                />
                <ScoreForm
                    title="PBL Evaluation"
                    rubric={RUBRICS.PBLQ}
                    scores={pblqScores}
                    setScores={setPblqScores}
                    onSave={handleSaveMarks}
                    loading={loadingStates.pblq}
                    evaluationType="pblq"
                />
            </div>

            <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold mb-2">Total Scores</h4>
                <ul className="list-disc ml-5 space-y-2">
                    <li>ISE 1 Total: {ise1Total.toFixed(1)} / 100</li>
                    <li>ISE 2 Total: {ise2Total.toFixed(1)} / 100</li>
                    <li>PBL Total: {pblqTotal.toFixed(1)} / 100</li>
                    <li className={`font-semibold ${isPBLQualified ? 'text-green-600' : 'text-red-600'}`}>
                        PBL Qualification: {isPBLQualified ? 'Qualified' : 'Not Qualified'}
                    </li>
                </ul>
            </div>

            <TaskDescription tasks={tasks} teamMembers={teamMembers} />
        </>
    );
};

export default ReportMaker;
