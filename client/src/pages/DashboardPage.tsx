import "./DashboardPage.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { getemployeelist } from "../api/employee";

type Activity = {
    id: number;
    employee: string;
    initials: string;
    action: string;
    detail: string;
    date: string;
    type: "evaluation" | "note" | "writeup" | "recognition";
};

const recentActivity: Activity[] = [
    {
        id: 1,
        employee: "Sarah Martin",
        initials: "SM",
        action: "Evaluation completed",
        detail: "Quarterly performance evaluation",
        date: "Today, 10:30 AM",
        type: "evaluation",
    },
    {
        id: 2,
        employee: "Daniel Roy",
        initials: "DR",
        action: "Manager note added",
        detail: "Follow-up regarding attendance",
        date: "Yesterday, 4:15 PM",
        type: "note",
    },
    {
        id: 3,
        employee: "Maya Chen",
        initials: "MC",
        action: "Recognition added",
        detail: "Excellent guest feedback",
        date: "July 14, 2026",
        type: "recognition",
    },
    {
        id: 4,
        employee: "Alex Tremblay",
        initials: "AT",
        action: "Write-up created",
        detail: "Written warning documented",
        date: "July 13, 2026",
        type: "writeup",
    },
];

const upcomingEvaluations = [
    {
        id: 1,
        employee: "Jordan Lee",
        position: "Server",
        date: "July 18",
        daysRemaining: 2,
    },
    {
        id: 2,
        employee: "Amélie Gagnon",
        position: "Team Leader",
        date: "July 22",
        daysRemaining: 6,
    },
    {
        id: 3,
        employee: "Noah Wilson",
        position: "Bartender",
        date: "July 27",
        daysRemaining: 11,
    },
];


import { apiFetch } from "../api/client";

async function upload_test_eval() {

    const response = await apiFetch(
        "/evaluation-templates", 
        {
            method: "POST",
            body: JSON.stringify({
                name: "Test Employee Evaluation",
                department: "Kitchen",
                version: "1.0",
              }),
        }
    );

    return response.json();
}

export default function DashboardPage() {
    const managerName = "Paul";
    const [employeeCounts, setEmployeeCounts] = useState<{ total: number; active: number } | null>(null);
    const [employeeError, setEmployeeError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        async function loadEmployeeCounts() {
            try {
                const data: unknown = await getemployeelist();
                if (!data || typeof data !== "object" || !("employeeList" in data) ||
                    !Array.isArray(data.employeeList)) {
                    throw new Error("Invalid employee list response.");
                }
                const employees = data.employeeList as Array<{ status?: string }>;
                if (!cancelled) {
                    setEmployeeCounts({
                        total: employees.length,
                        active: employees.filter(employee => employee.status === "ACTIVE").length,
                    });
                }
            } catch (error) {
                console.error("Failed to load dashboard employee counts:", error);
                if (!cancelled) setEmployeeError(true);
            }
        }
        void loadEmployeeCounts();
        return () => { cancelled = true; };
    }, []);


    return (
        <main className="dashboard-page">
            <header className="dashboard-header">
                <div>
                    <p className="dashboard-eyebrow">Overview</p>

                    <h1>Good evening, {managerName}</h1>

                    <p>
                        Here is what is happening with your team today.
                    </p>
                </div>

                <div className="dashboard-header-actions">

                <button className="secondary-button" type="button" onClick={upload_test_eval}>
                        Test Button
                    </button>

                    <button className="secondary-button" type="button">
                        Add manager note
                    </button>

                    <Link className="primary-button" to="/evaluation-templates/new" style={{display:"inline-flex",alignItems:"center",textDecoration:"none"}}>
                        Create evaluation template
                    </Link>
                </div>
            </header>

            <section className="summary-grid">
                <article className="summary-card">
                    <span className="summary-icon employees-icon" aria-hidden="true">👥</span>
                    <div className="summary-card-info">
                        <p>Total employees</p>
                        <strong>{employeeCounts?.total ?? "—"}</strong>
                        <span className="summary-card-subtext">{employeeError ? "Unable to load employees" : employeeCounts ? `${employeeCounts.active} active employees` : "Loading employees…"}</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon evaluation-icon" aria-hidden="true">✓</span>
                    <div className="summary-card-info">
                        <p>Evaluations completed</p>
                        <strong>12</strong>
                        <span className="summary-card-subtext">This quarter</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon note-icon" aria-hidden="true">✎</span>
                    <div className="summary-card-info">
                        <p>Manager notes</p>
                        <strong>27</strong>
                        <span className="summary-card-subtext">Added this month</span>
                    </div>
                </article>
                <article className="summary-card">
                    <span className="summary-icon writeup-icon" aria-hidden="true">!</span>
                    <div className="summary-card-info">
                        <p>Open write-ups</p>
                        <strong>4</strong>
                        <span className="summary-card-subtext">2 awaiting follow-up</span>
                    </div>
                </article>
            </section>

            <section className="dashboard-content-grid">
                <article className="dashboard-panel activity-panel">
                    <div className="panel-header">
                        <div>
                            <h2>Recent activity</h2>
                            <p>Latest employee record updates</p>
                        </div>

                        <button className="text-button" type="button">
                            View all
                        </button>
                    </div>

                    <div className="activity-list">
                        {recentActivity.map((activity) => (
                            <div
                                className="activity-item"
                                key={activity.id}
                            >
                                <div className="employee-avatar">
                                    {activity.initials}
                                </div>

                                <div className="activity-information">
                                    <div className="activity-title-row">
                                        <strong>
                                            {activity.employee}
                                        </strong>

                                        <span
                                            className={`activity-type ${activity.type}`}
                                        >
                                            {activity.type}
                                        </span>
                                    </div>

                                    <p>{activity.action}</p>
                                    <span>{activity.detail}</span>
                                </div>

                                <time>{activity.date}</time>
                            </div>
                        ))}
                    </div>
                </article>

                <aside className="dashboard-side-column">
                    <article className="dashboard-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Upcoming evaluations</h2>
                                <p>Scheduled in the next 30 days</p>
                            </div>
                        </div>

                        <div className="evaluation-list">
                            {upcomingEvaluations.map((evaluation) => (
                                <div
                                    className="evaluation-item"
                                    key={evaluation.id}
                                >
                                    <div>
                                        <strong>
                                            {evaluation.employee}
                                        </strong>

                                        <span>
                                            {evaluation.position}
                                        </span>
                                    </div>

                                    <div className="evaluation-date">
                                        <strong>{evaluation.date}</strong>

                                        <span>
                                            {evaluation.daysRemaining} days
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className="panel-button"
                            type="button"
                        >
                            View evaluation schedule
                        </button>
                    </article>

                    <article className="dashboard-panel quick-actions-panel">
                        <div className="panel-header">
                            <div>
                                <h2>Quick actions</h2>
                                <p>Common management tasks</p>
                            </div>
                        </div>

                        <div className="quick-action-grid">
                            <button type="button">
                                <span>＋</span>
                                Add note
                            </button>

                            <button type="button">
                                <span>★</span>
                                Start evaluation
                            </button>

                            <button type="button">
                                <span>!</span>
                                Create write-up
                            </button>

                            <button type="button">
                                <span>⌕</span>
                                Find employee
                            </button>
                        </div>
                    </article>
                </aside>
            </section>
        </main>
    );
}