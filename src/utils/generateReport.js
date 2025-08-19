// src/utils/generateReport.js

export const generateTeamReport = async (teamData) => {
    const HF_API_URL = "your url";
    const HF_API_KEY = "your kry"; // Replace with your key

    // Calculate task statistics
    const totalTasks = teamData.tasks.length;
    const completedTasks = teamData.tasks.filter(task => task.status === 'completed').length;
    const ongoingTasks = teamData.tasks.filter(task => task.status === 'ongoing').length;
    const pendingTasks = teamData.tasks.filter(task => task.status === 'todo').length;

    const taskText = teamData.tasks.map((task, index) =>
        `Task ${index + 1}: "${task.title}"
        - Description: ${task.description}
        - Status: ${task.status}
        - Assigned To: ${task.assignedTo}
        - Assigned By: ${task.assignedBy}
        - Created: ${task.createdAt}
        ${task.completedAt ? `- Completed: ${task.completedAt}` : ''}`
    ).join("\n\n");

    const fullPrompt = `
    Generate a detailed progress report for this mini project team:

    Team Name: ${teamData.teamName}

    Task Statistics:
    - Total Tasks: ${totalTasks}
    - Completed: ${completedTasks}
    - Ongoing: ${ongoingTasks}
    - Pending: ${pendingTasks}

    Detailed Task List:
    ${taskText}

    Please provide:
    1. Overall team progress assessment
    2. Key achievements and completed tasks
    3. Current ongoing work
    4. Pending tasks and potential bottlenecks
    5. Recommendations for improvement
    `;

    try {
        const response = await fetch(HF_API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${HF_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ inputs: fullPrompt })
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        const data = await response.json();
        return data[0]?.generated_text || "No report generated.";
    } catch (error) {
        console.error('Error generating report:', error);
        return "Error generating report. Please try again later.";
    }
};

// Export as default as well for flexibility
export default generateTeamReport; 