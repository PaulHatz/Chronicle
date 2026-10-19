import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./EmployeePage.css";
import {useLanguage} from "../i18n/LanguageContext";

import { getemployee, getemployeenotes, getemployeewriteups, createManagerNote, createEmployeeWriteUp, resolveEmployeeWriteUp, type WriteUpType, type ManagerNoteType, updateEmployeeProfile, type EmployeeProfileInput } from "../api/employee";
import {getDepartmentOptions,type DepartmentOption} from "../api/departments";
import { getEmployeeEvaluations } from "../api/employee-evaluations";
import { getEmployeeGoals, createEmployeeGoal, updateEmployeeGoal, deleteEmployeeGoal, type EmployeeGoal } from "../api/goals";


function formatProfileDate(value: string | null | undefined): string {
    if (!value) return "N/A";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString(document.documentElement.lang === "fr-CA" ? "fr-CA" : "en-CA", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

type EmployeeStatus = "Active" | "Inactive" | "Leave";

type Employee = {
    id: number;
    name: string;
    initials: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    status: EmployeeStatus;
    hireDate: string;
    manager: string;
    lastEvaluation: string;
    nextEvaluation: string;
    performanceScore: number | null;
    performanceMaxScore: number;
    notes: number;
    recognitions: number;
    openWriteUps: number;
    completedEvaluations: number;
};

type TimelineEventType =
    | "evaluation"
    | "note"
    | "recognition"
    | "writeup"
    | "training";

type TimelineEvent = {
    id: number;
    type: TimelineEventType;
    title: string;
    description: string;
    author: string;
    date: string;
    evaluationId?: number;
    writeUpId?: number;
    resolvedAt?: string | null;
    noteType?: ManagerNoteType;
};
/*
const timelineEvents: TimelineEvent[] = [
    {
        id: 1,
        type: "evaluation",
        title: "Quarterly evaluation completed",
        description:
            "Sarah received strong results in guest service, teamwork, and reliability. Speed during high-volume periods remains a development priority.",
        author: "Paul Hatzievagelou",
        date: "June 12, 2026",
    },
    {
        id: 2,
        type: "recognition",
        title: "Guest recognition added",
        description:
            "A guest specifically mentioned Sarah's patience and attentiveness while assisting a large group.",
        author: "Maya Chen",
        date: "May 28, 2026",
    },
    {
        id: 3,
        type: "note",
        title: "Coaching follow-up",
        description:
            "Reviewed table organization and communication with support staff during event-night service.",
        author: "Paul Hatzievagelou",
        date: "May 11, 2026",
    },
    {
        id: 4,
        type: "training",
        title: "Training completed",
        description:
            "Completed the updated responsible alcohol service training module.",
        author: "Chronicle",
        date: "April 22, 2026",
    },
    {
        id: 5,
        type: "evaluation",
        title: "Performance evaluation completed",
        description:
            "Overall performance improved from the previous quarter, particularly in teamwork and guest awareness.",
        author: "Paul Hatzievagelou",
        date: "March 12, 2026",
    },
];
*/
type TabName = "timeline" | "evaluations" | "notes" | "writeups";

export default function EmployeePage() {
    const {t}=useLanguage();
    const { employeeId } = useParams();
    const [profileDraft,setProfileDraft]=useState<EmployeeProfileInput|null>(null);
    const [departments,setDepartments]=useState<DepartmentOption[]>([]);
    const [profileSaving,setProfileSaving]=useState(false);
    const [profileError,setProfileError]=useState("");
    const [activeTab, setActiveTab] = useState<TabName>("timeline");
    const [employee, setEmployee] = useState<Employee>();
    const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
    const [, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [recordForm, setRecordForm] = useState<"note"|"writeup"|"recognition"|null>(null);
    const [noteTitle, setNoteTitle] = useState("");
    const [noteType, setNoteType] = useState<ManagerNoteType>("GENERAL");
    const [recordContent, setRecordContent] = useState("");
    const [warningType, setWarningType] = useState<WriteUpType>("VERBAL_WARNING");
    const [savingRecord, setSavingRecord] = useState(false);
    const [recordError, setRecordError] = useState("");
    const [refreshToken, setRefreshToken] = useState(0);
    const [goals, setGoals] = useState<EmployeeGoal[]>([]);
    const [goalsError, setGoalsError] = useState("");
    const [goalsLoading, setGoalsLoading] = useState(true);
    const [showCompletedGoals, setShowCompletedGoals] = useState(false);
    const [completingGoals, setCompletingGoals] = useState<number[]>([]);
    const [manageGoals, setManageGoals] = useState(false);
    const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
    const [goalTitle, setGoalTitle] = useState("");
    const [goalDescription, setGoalDescription] = useState("");
    const [goalDate, setGoalDate] = useState("");
    const [goalSaving, setGoalSaving] = useState(false);
    const [goalFormError, setGoalFormError] = useState("");

    async function openProfileEditor(){
        setProfileError("");
        try {
            const [result, available] = await Promise.all([getemployee(Number(employeeId)),getDepartmentOptions()]);
            const value=result.employee;
            setDepartments(available);
            setProfileDraft({firstName:value.firstName,lastName:value.lastName,email:value.email??"",phone:value.phone??"",position:value.position,departmentId:value.departmentId,status:value.status,hireDate:String(value.hireDate).slice(0,10)});
        }catch(e){setProfileError(e instanceof Error?e.message:"Unable to load profile.");}
    }
    async function saveProfile(event:React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        if(!profileDraft)return;
        setProfileSaving(true);setProfileError("");
        try{
            await updateEmployeeProfile(Number(employeeId),profileDraft);
            setProfileDraft(null);
            setRefreshToken(value=>value+1);
        }catch(e){setProfileError(e instanceof Error?e.message:"Unable to update profile.");}
        finally{setProfileSaving(false);}
    }
    async function submitRecord(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!recordForm) return;
        setSavingRecord(true); setRecordError("");
        try {
            if (recordForm === "note" || recordForm === "recognition") await createManagerNote(Number(employeeId), {title:noteTitle,content:recordContent,type:recordForm === "recognition" ? "POSITIVE" : noteType});
            else await createEmployeeWriteUp(Number(employeeId), {type:warningType,reason:recordContent});
            setRecordForm(null); setNoteTitle(""); setNoteType("GENERAL"); setRecordContent("");
            setRefreshToken(value=>value+1);
        } catch(e) { setRecordError(e instanceof Error ? e.message : "Unable to save record."); }
        finally { setSavingRecord(false); }
    }
    async function resolveRecord(id:number) {
        if (!window.confirm("Mark this write-up as resolved?")) return;
        try { await resolveEmployeeWriteUp(Number(employeeId),id); setRefreshToken(value=>value+1); }
        catch(e) { setError(e instanceof Error ? e.message : "Could not resolve write-up."); }
    }

    useEffect(() => {
            let cancelled = false;
        
            async function loadEmployee() {
                try {
                    const id = Number(employeeId);
                    const [profile, notes, writeUps, evaluations] = await Promise.all([
                        getemployee(id),
                        getemployeenotes(id),
                        getemployeewriteups(id),
                        getEmployeeEvaluations(id),
                    ]);
                    const data = profile.employee;
                    const data_notes = notes.notes;
                    const data_writeups = writeUps.notes;

                    if (!cancelled) {
                            const latestEvaluation = [...evaluations].sort((a,b) => new Date(b.completedAt).getTime()-new Date(a.completedAt).getTime())[0];
                            const numericAnswers = (latestEvaluation?.answers ?? []).filter(answer =>
                                answer.question.questionType === "NUMERIC" &&
                                typeof answer.scoreAnswer === "number" &&
                                Number.isFinite(answer.scoreAnswer) &&
                                typeof answer.question.maxScore === "number" &&
                                answer.question.maxScore > 0
                            );
                            const performanceScore = numericAnswers.length
                                ? numericAnswers.reduce((sum,answer) => sum + answer.scoreAnswer!, 0) / numericAnswers.length
                                : null;
                            const performanceMaxScore = numericAnswers.length
                                ? numericAnswers.reduce((sum,answer) => sum + answer.question.maxScore!, 0) / numericAnswers.length
                                : 5;
                            const emp: Employee = {
                                id: data.id,
                                name: data.firstName + " " + data.lastName,
                                initials: String(data.firstName[0] + data.lastName[0]),
                                email: data.email,
                                phone: data.phone,
                                position: data.position,
                                department: data.department?.name ?? "Unknown",
                                status: data.status,
                                hireDate: formatProfileDate(data.hireDate),
                                manager: "N/A",
                                lastEvaluation: evaluations.length ? formatProfileDate(evaluations[0].completedAt) : "N/A",
                                nextEvaluation: data.nextEvaluationAt ? formatProfileDate(data.nextEvaluationAt) : "N/A",
                                performanceScore,
                                performanceMaxScore,
                                notes: data_notes.length,
                                recognitions: data_notes.filter((note: {type?: ManagerNoteType}) => note.type === "POSITIVE").length,
                                openWriteUps: data_writeups.filter((w: {resolvedAt?:string|null}) => !w.resolvedAt).length,
                                completedEvaluations: evaluations.length
                            };

                        setEmployee(emp);
                        
                        const employee_notes: TimelineEvent[] = data_notes.map(
                            (note: {id:number;type?:ManagerNoteType;title:string;content:string;createdAt:string}): TimelineEvent => ({
                                id: note.id,
                                type: "note",
                                noteType: note.type ?? "GENERAL",
                                title: note.title,
                                description: note.content,
                                author: "N/A",
                                date: note.createdAt
                        }));

                        const employee_writeups: TimelineEvent[] = data_writeups.map(
                            (writeup: {id:number;resolvedAt?:string|null;type:WriteUpType;reason:string;createdAt:string}): TimelineEvent => ({
                                id: writeup.id,
                                writeUpId: writeup.id,
                                resolvedAt: writeup.resolvedAt,
                                type: "writeup",
                                title: writeup.type,
                                description: writeup.reason,
                                author: "N/A",
                                date: writeup.createdAt
                        }));


                        const employee_evaluations: TimelineEvent[] = evaluations.map((evaluation) => ({
                            id: evaluation.id,
                            evaluationId: evaluation.id,
                            type: "evaluation",
                            title: evaluation.template.name + " completed",
                            description: evaluation.answers.length + " questions answered",
                            author: "Manager",
                            date: evaluation.completedAt,
                        }));
                        const timelineEvent: TimelineEvent[] = [...employee_notes, ...employee_writeups, ...employee_evaluations]
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                        setTimelineEvents(timelineEvent);
    
                    }
                } catch (error) {
                    if (!cancelled) {
                        setError(
                            error instanceof Error
                                ? error.message
                                : "Failed to load employees",
                        );
                    }
                } finally {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                }
            }
        
            loadEmployee();
            return () => {
                cancelled = true;
            };
        }, [employeeId, refreshToken]);


    useEffect(() => {
        const id = Number(employeeId);
        if (!Number.isSafeInteger(id) || id <= 0) return;
        let cancelled = false;
        void getEmployeeGoals(id)
          .then(data => { if (!cancelled) { setGoals(data); setGoalsError(""); } })
          .catch(err => { if (!cancelled) setGoalsError(err instanceof Error ? err.message : "Unable to load goals."); })
          .finally(() => { if (!cancelled) setGoalsLoading(false); });
        return () => { cancelled = true; };
    }, [employeeId]);

    function openGoalEditor(goal?: EmployeeGoal) {
        setEditingGoalId(goal?.id ?? null);
        setGoalTitle(goal?.title ?? "");
        setGoalDescription(goal?.description ?? "");
        setGoalDate(goal?.duration.slice(0, 10) ?? "");
        setGoalFormError("");
        setManageGoals(true);
    }

    async function saveGoal(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setGoalFormError("");
        if (!goalTitle.trim() || !goalDescription.trim() || !goalDate) {
            setGoalFormError("Title, description, and target date are required.");
            return;
        }
        setGoalSaving(true);
        try {
            const input = {title: goalTitle.trim(), description: goalDescription.trim(), duration: goalDate, status: editingGoalId === null ? "INCOMPLETE" as const : goals.find(goal => goal.id === editingGoalId)?.status ?? "INCOMPLETE" as const};
            if (editingGoalId === null) await createEmployeeGoal(Number(employeeId), input);
            else await updateEmployeeGoal(Number(employeeId), editingGoalId, input);
            setGoals(await getEmployeeGoals(Number(employeeId)));
            setManageGoals(false);
            setGoalsError("");
        } catch (err) {
            setGoalFormError(err instanceof Error ? err.message : "Unable to save goal.");
        } finally { setGoalSaving(false); }
    }

    async function changeGoalStatus(goal: EmployeeGoal) {
        if (completingGoals.includes(goal.id)) return;
        const nextStatus = goal.status === "COMPLETED" ? "INCOMPLETE" : "COMPLETED";
        if (nextStatus === "COMPLETED") setCompletingGoals(current => [...current, goal.id]);
        try {
            await updateEmployeeGoal(Number(employeeId), goal.id, {status: nextStatus});
            if (nextStatus === "COMPLETED") await new Promise<void>(resolve => window.setTimeout(resolve, 850));
            setGoals(await getEmployeeGoals(Number(employeeId)));
            setGoalsError("");
        } catch(err) { setGoalsError(err instanceof Error ? err.message : "Unable to update goal."); }
        finally { setCompletingGoals(current => current.filter(id => id !== goal.id)); }
    }

    async function removeGoal(goal: EmployeeGoal) {
        if (!window.confirm(`Delete goal "${goal.title}"?`)) return;
        setGoalSaving(true);
        try {
            await deleteEmployeeGoal(Number(employeeId),goal.id);
            setGoals(await getEmployeeGoals(Number(employeeId)));
            setManageGoals(false);
            setGoalsError("");
        } catch(err) { setGoalFormError(err instanceof Error ? err.message : "Unable to delete goal."); }
        finally { setGoalSaving(false); }
    }

    if (!employee) {
        return (
            <main className="employee-profile-page">
                <section className="employee-not-found">
                    <div className="not-found-icon">?</div>
                    <h1>{t("employeeNotFound")}</h1>
                    <p>
                        {t("employeeMissingMessage")}
                    </p>

                    <Link to="/employees">
                        {t("returnDirectory")}
                    </Link>
                </section>
            </main>
        );
    }

    const filteredEvents = timelineEvents.filter((event) => {
        if (activeTab === "timeline") {
            return true;
        }

        if (activeTab === "evaluations") {
            return event.type === "evaluation";
        }

        if (activeTab === "notes") {
            return event.type === "note";
        }

        if (activeTab === "writeups") {
            return event.type === "writeup";
        }

        return true;
    });

    return (
        <main className="employee-profile-page">
            <div className="employee-profile-container">
                <Link className="back-link" to="/employees">
                    <span>←</span>
                    {t("backEmployees")}
                </Link>

                <section className="employee-profile-header">
                    <div className="employee-profile-identity">
                        <div className="profile-avatar">
                            {employee.initials}

                            <span
                                className={`profile-presence profile-presence-${employee.status.toLowerCase()}`}
                            />
                        </div>

                        <div>
                            <div className="employee-title-row">
                                <h1>{employee.name}</h1>

                                <span
                                    className={`profile-status profile-status-${employee.status.toLowerCase()}`}
                                >
                                    {employee.status.toUpperCase() === "LEAVE" ? t("onLeave") : employee.status.toUpperCase() === "ACTIVE" ? t("active") : t("inactive")}
                                </span>
                            </div>

                            <p className="employee-position">
                                {employee.position}
                                <span>•</span>
                                {employee.department}
                            </p>

                            <div className="employee-contact-row">
                                <a href={`mailto:${employee.email}`}>
                                    {employee.email}
                                </a>

                                <span>•</span>

                                <a href={`tel:${employee.phone}`}>
                                    {employee.phone}
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="profile-header-actions">
                        <button className="profile-secondary-button" type="button" onClick={()=>void openProfileEditor()}>{t("editProfile")}</button>
                    </div>
                </section>


                {profileError&&!profileDraft&&<p role="alert" className="employee-record-error">{profileError}</p>}
                {profileDraft&&<div className="employee-record-backdrop" onMouseDown={()=>{if(!profileSaving)setProfileDraft(null);}}>
                    <section className="employee-record-modal employee-edit-modal" role="dialog" aria-modal="true" aria-label={t("editProfile")} onMouseDown={e=>e.stopPropagation()}>
                        <h2>{t("editProfile")}</h2>
                        <form onSubmit={saveProfile}>
                            <div className="employee-edit-fields">
                                <label>{t("firstName")}<input required maxLength={100} value={profileDraft.firstName} onChange={e=>setProfileDraft(d=>d&&({...d,firstName:e.target.value}))}/></label>
                                <label>{t("lastName")}<input required maxLength={100} value={profileDraft.lastName} onChange={e=>setProfileDraft(d=>d&&({...d,lastName:e.target.value}))}/></label>
                                <label>{t("emailAddress")}<input type="email" value={profileDraft.email} onChange={e=>setProfileDraft(d=>d&&({...d,email:e.target.value}))}/></label>
                                <label>Phone<input type="tel" value={profileDraft.phone} onChange={e=>setProfileDraft(d=>d&&({...d,phone:e.target.value}))}/></label>
                                <label>{t("position")}<input required maxLength={100} value={profileDraft.position} onChange={e=>setProfileDraft(d=>d&&({...d,position:e.target.value}))}/></label>
                                <label>{t("departments")}<select value={profileDraft.departmentId} onChange={e=>setProfileDraft(d=>d&&({...d,departmentId:Number(e.target.value)}))}>{departments.map(dep=><option value={dep.id} key={dep.id}>{dep.name}</option>)}</select></label>
                                <label>{t("status")}<select value={profileDraft.status} onChange={e=>setProfileDraft(d=>d&&({...d,status:e.target.value as EmployeeProfileInput["status"]}))}><option value="ACTIVE">{t("active")}</option><option value="INACTIVE">{t("inactive")}</option><option value="LEAVE">{t("onLeave")}</option></select></label>
                                <label>{t("hireDate")}<input type="date" required value={profileDraft.hireDate} onChange={e=>setProfileDraft(d=>d&&({...d,hireDate:e.target.value}))}/></label>
                            </div>
                            {profileError&&<p className="employee-record-error" role="alert">{profileError}</p>}
                            <div className="employee-record-actions"><button type="button" disabled={profileSaving} onClick={()=>setProfileDraft(null)}>{t("cancel")}</button><button type="submit" disabled={profileSaving}>{profileSaving?t("saving"):t("saveChanges")}</button></div>
                        </form>
                    </section>
                </div>}
                {recordForm && <div className="employee-record-backdrop" role="presentation" onMouseDown={() => !savingRecord && setRecordForm(null)}>
                    <section className="employee-record-modal" role="dialog" aria-modal="true" aria-label={recordForm === "recognition" ? t("addRecognition") : recordForm === "note" ? t("addNoteTitle") : t("createWriteUp")} onMouseDown={e=>e.stopPropagation()}>
                        <h2>{recordForm === "recognition" ? t("addRecognition") : recordForm === "note" ? t("addNoteTitle") : t("createWriteUp")}</h2>
                        <p>{t("recordFor",{name:employee.name})}</p>
                        <form onSubmit={submitRecord}>
                            {recordForm !== "writeup" ? <>{recordForm === "note" && <fieldset className="note-type-fieldset"><legend>{t("noteType")}</legend><div className="note-type-button-group" role="group" aria-label={t("noteType")}>{([["GENERAL","General"],["POSITIVE","Positive"],["IMPROVEMENT","Needs improvement"]] as const).map(([value])=><button key={value} type="button" className={`note-type-option${noteType === value ? " selected" : ""}`} aria-pressed={noteType === value} onClick={()=>setNoteType(value)}>{t(value === "GENERAL" ? "general" : value === "POSITIVE" ? "positive" : "needsImprovement")}</button>)}</div></fieldset>}<label>{t("title")}<input required maxLength={200} value={noteTitle} onChange={e=>setNoteTitle(e.target.value)}/></label></>
                              : <label>{t("warningType")}<select value={warningType} onChange={e=>setWarningType(e.target.value as WriteUpType)}>
                                <option value="VERBAL_WARNING">{t("verbalWarning")}</option><option value="WRITTEN_WARNING">{t("writtenWarning")}</option><option value="FINAL_WARNING">{t("finalWarning")}</option>
                              </select></label>}
                            <label>{recordForm === "recognition" ? t("recognitionDetails") : recordForm === "note" ? t("noteDetails") : t("reasonDetails")}<textarea required rows={6} maxLength={10000} value={recordContent} onChange={e=>setRecordContent(e.target.value)}/></label>
                            {recordError && <p role="alert" className="employee-record-error">{recordError}</p>}
                            <div className="employee-record-actions"><button type="button" disabled={savingRecord} onClick={()=>setRecordForm(null)}>{t("cancel")}</button><button type="submit" disabled={savingRecord}>{savingRecord ? t("saving") : t("saveRecord")}</button></div>
                        </form>
                    </section>
                </div>}
                {manageGoals && <div className="employee-record-backdrop" role="presentation" onMouseDown={() => !goalSaving && setManageGoals(false)}>
                    <section className="employee-record-modal goal-editor-modal" role="dialog" aria-modal="true" aria-label={editingGoalId === null ? t("newGoal") : t("editGoal")} onMouseDown={event=>event.stopPropagation()}>
                        <h2>{editingGoalId === null ? "Create development goal" : "Edit development goal"}</h2>
                        <p>Development goal for {employee.name}</p>
                        <form onSubmit={saveGoal}>
                            <label>{t("title")}<input required maxLength={200} value={goalTitle} onChange={event=>setGoalTitle(event.target.value)}/></label>
                            <label>{t("description")}<textarea required rows={4} maxLength={10000} value={goalDescription} onChange={event=>setGoalDescription(event.target.value)}/></label>
                            <label>{t("targetDate")}<input required type="date" value={goalDate} onChange={event=>setGoalDate(event.target.value)}/></label>
                            
                            {goalFormError && <p role="alert" className="goal-form-error">{goalFormError}</p>}
                            <div className="employee-record-actions">
                                {editingGoalId !== null && <button type="button" disabled={goalSaving} onClick={() => { const goal=goals.find(item=>item.id===editingGoalId); if(goal) void removeGoal(goal); }}>{t("deleteGoal")}</button>}
                                <button type="button" disabled={goalSaving} onClick={()=>setManageGoals(false)}>{t("cancel")}</button>
                                <button type="submit" disabled={goalSaving}>{goalSaving?t("saving"):t("saveGoalLabel")}</button>
                            </div>
                        </form>
                    </section>
                </div>}
                <section className="employee-overview-grid">
                    <article className="employee-information-card">
                        <div className="section-heading">
                            <div>
                                <p className="section-eyebrow">
                                    {t("profileInformation")}
                                </p>
                                <h2>{t("profileDetails")}</h2>
                            </div>
                        </div>

                        <dl className="employee-details-grid">
                            <div>
                                <dt>{t("position")}</dt>
                                <dd>{employee.position}</dd>
                            </div>

                            <div>
                                <dt>{t("department")}</dt>
                                <dd>{employee.department}</dd>
                            </div>

                            <div>
                                <dt>{t("hireDate")}</dt>
                                <dd>{employee.hireDate}</dd>
                            </div>

                            <div>
                                <dt>{t("directManager")}</dt>
                                <dd>{employee.manager}</dd>
                            </div>

                            <div>
                                <dt>{t("lastEvaluation")}</dt>
                                <dd>{employee.lastEvaluation}</dd>
                            </div>

                            <div>
                                <dt>{t("nextEvaluation")}</dt>
                                <dd>{employee.nextEvaluation}</dd>
                            </div>
                        </dl>
                    </article>

                    <article className="performance-card">
                        <div className="section-heading">
                            <div>
                                <p className="section-eyebrow">
                                    {t("currentPerformance")}
                                </p>
                                <h2>{t("performanceScore")}</h2>
                            </div>
                        </div>

                        <div className="performance-score-row">
                            <div className="performance-score">
                                <strong>
                                    {employee.performanceScore === null ? "—" : employee.performanceScore.toFixed(1)}
                                </strong>
                                <span>{employee.performanceScore === null ? t("noNumericScores") : t("outOf",{value:Number(employee.performanceMaxScore.toFixed(1))})}</span>
                            </div>

                            <div className="performance-rating">
                                <strong>{employee.performanceScore === null ? t("notYetScored") : t("latestEvaluation")}</strong>
                                <span>
                                    {employee.performanceScore === null ? t("completeEvaluationPrompt") : t("averageNumeric")}
                                </span>
                            </div>
                        </div>

                        <div className="performance-progress">
                            <span
                                style={{
                                    width: `${
                                        ((employee.performanceScore ?? 0) / employee.performanceMaxScore) *
                                        100
                                    }%`,
                                }}
                            />
                        </div>

                        <div className="evaluation-date-box">
                            <span>{t("nextEvaluation")}</span>
                            <strong>{employee.nextEvaluation}</strong>
                        </div>
                    </article>
                </section>

                <section className="employee-stat-grid">
                    <article className="employee-stat-card">
                        <div className="stat-icon stat-icon-blue">✓</div>

                        <div>
                            <span>{t("evaluations")}</span>
                            <strong>
                                {employee.completedEvaluations}
                            </strong>
                            <small>{t("completed")}</small>
                        </div>
                    </article>

                    <article className="employee-stat-card">
                        <div className="stat-icon stat-icon-purple">
                            ✎
                        </div>

                        <div>
                            <span>{t("managerNotes")}</span>
                            <strong>{employee.notes}</strong>
                            <small>{t("totalRecords")}</small>
                        </div>
                    </article>

                    <article className="employee-stat-card">
                        <div className="stat-icon stat-icon-red">!</div>

                        <div>
                            <span>{t("openWriteUps")}</span>
                            <strong>{employee.openWriteUps}</strong>
                            <small>{t("requiresFollowUp")}</small>
                        </div>
                    </article>

                    <article className="employee-stat-card">
                        <div className="stat-icon stat-icon-green">
                            ★
                        </div>

                        <div>
                            <span>{t("recognitions")}</span>
                            <strong>{employee.recognitions}</strong>
                            <small>{t("positiveNotes")}</small>
                        </div>
                    </article>
                </section>

                <section className="employee-profile-content">
                    <article className="employee-history-panel">
                        <div className="employee-tabs">
                            <button
                                className={
                                    activeTab === "timeline"
                                        ? "active"
                                        : ""
                                }
                                type="button"
                                onClick={() =>
                                    setActiveTab("timeline")
                                }
                            >{t("timeline")}</button>

                            <button
                                className={
                                    activeTab === "evaluations"
                                        ? "active"
                                        : ""
                                }
                                type="button"
                                onClick={() =>
                                    setActiveTab("evaluations")
                                }
                            >{t("evaluations")}</button>

                            <button
                                className={
                                    activeTab === "notes"
                                        ? "active"
                                        : ""
                                }
                                type="button"
                                onClick={() => setActiveTab("notes")}
                            >{t("notes")}</button>

                            <button
                                className={
                                    activeTab === "writeups"
                                        ? "active"
                                        : ""
                                }
                                type="button"
                                onClick={() =>
                                    setActiveTab("writeups")
                                }
                            >{t("writeUps")}</button>
                        </div>

                        <div className="history-panel-heading">
                            <div>
                                <h2>
                                    {activeTab === "timeline"
                                        ? t("evaluationTimeline")
                                        : activeTab.charAt(0).toUpperCase() +
                                          activeTab.slice(1)}
                                </h2>

                                <p>
                                    {t("evaluationHistory")}
                                </p>
                            </div>


                        </div>

                        <div className="timeline-list">
                            {filteredEvents.map((event) => (
                                <article
                                    className="timeline-event"
                                    key={`${event.type}-${event.id}`}
                                >
                                    <div
                                        className={`timeline-icon timeline-icon-${event.type}`}
                                    >
                                        {getTimelineIcon(event.type)}
                                    </div>

                                    <div className="timeline-event-content">
                                        <div className="timeline-title-row">
                                            <div>
                                                <span
                                                    className={`timeline-type timeline-type-${event.type}`}
                                                >
                                                    {event.type === "note" ? (event.noteType === "POSITIVE" ? t("positiveNote") : event.noteType === "IMPROVEMENT" ? t("improveNote") : t("generalNote")) : (event.type === "writeup" ? t("writeUps") : event.type === "evaluation" ? t("evaluations") : event.type === "recognition" ? t("recognitions") : getTimelineLabel(event.type))}
                                                </span>

                                                <h3>{event.evaluationId ? <Link to={`/employees/${employee.id}/evaluations/${event.evaluationId}`}>{event.title}</Link> : (event.type === "writeup" ? t(event.title === "VERBAL_WARNING" ? "verbalWarning" : event.title === "WRITTEN_WARNING" ? "writtenWarning" : "finalWarning") : event.title)}</h3>
                                            </div>

                                            <time>{formatProfileDate(event.date)}</time>
                                        </div>

                                        <p>{event.description}</p>
                                        {event.writeUpId && <div className="writeup-resolution">
                                            <span>{event.resolvedAt ? "Resolved" : "Open"}</span>
                                            {!event.resolvedAt && <button type="button" onClick={() => void resolveRecord(event.writeUpId!)}>{t("markResolved")}</button>}
                                        </div>}
                                        {event.evaluationId && <Link className="evaluation-timeline-link" to={`/employees/${employee.id}/evaluations/${event.evaluationId}`}>{t("viewEvaluationResult")}</Link>}

                                        <div className="timeline-author">
                                            Added by{" "}
                                            <strong>{event.author}</strong>
                                        </div>
                                    </div>
                                </article>
                            ))}

                            {filteredEvents.length === 0 && (
                                <div className="empty-timeline">
                                    <div>⌕</div>
                                    <h3>{t("noRecord")}</h3>
                                    <p>
                                        There are no records in this
                                        category yet.
                                    </p>
                                </div>
                            )}
                        </div>
                    </article>

                    <aside className="employee-profile-sidebar">
                        <article className="profile-side-card">
                            <div className="side-card-heading">
                                <h2>{t("quickActions")}</h2>
                                <p>
                                    {t("eventToRecord")}
                                </p>
                            </div>

                            <div className="profile-action-list">
                                <button type="button" onClick={() => {setRecordForm("note");setRecordError("");}}>
                                    <span className="action-icon action-blue">
                                        ✎
                                    </span>

                                    <div>
                                        <strong>{t("addNote")}</strong>
                                        <small>
                                            {t("recordFeedback")}
                                        </small>
                                    </div>

                                    <b>→</b>
                                </button>

                                <Link to={`/employees/${employee.id}/evaluate`} className="employee-start-evaluation">
                                    <span className="action-icon action-green">
                                        ✓
                                    </span>

                                    <div>
                                        <strong>{t("startEvaluation")}</strong>
                                        <small>
                                            {t("completePerformanceReview")}
                                        </small>
                                    </div>

                                    <b>→</b>
                                </Link>

                                <button type="button" onClick={() => {setRecordForm("note");setNoteType("POSITIVE");setNoteTitle("");setRecordContent("");setRecordError("");}}>
                                    <span className="action-icon action-yellow">
                                        ★
                                    </span>

                                    <div>
                                        <strong>{t("addRecognition")}</strong>
                                        <small>
                                            {t("recognizePerformance")}
                                        </small>
                                    </div>

                                    <b>→</b>
                                </button>

                                <button type="button" onClick={() => {setRecordForm("writeup");setRecordError("");}}>
                                    <span className="action-icon action-red">
                                        !
                                    </span>

                                    <div>
                                        <strong>{t("createWriteUp")}</strong>
                                        <small>
                                            {t("documentDiscipline")}
                                        </small>
                                    </div>

                                    <b>→</b>
                                </button>
                            </div>
                        </article>

                        <article className="profile-side-card">
                            <div className="side-card-heading goals-card-heading">
                                <div><h2>{t("developmentGoals")}</h2><p>{t("currentObjectives")}</p></div>
                                <button className="goal-add-button" type="button" aria-label={t("goalAddLabel")} title={t("goalAddLabel")} onClick={() => openGoalEditor()}>+</button>
                            </div>
                            {goalsError && <p className="goal-form-error" role="alert">{goalsError}</p>}
                            <div className="goal-list">
                                {goalsLoading ? <p className="goals-empty">{t("loadingGoals")}</p> :
                                    goals.filter(goal => showCompletedGoals ? goal.status === "COMPLETED" : goal.status === "INCOMPLETE").length === 0 ?
                                      <p className="goals-empty">{showCompletedGoals ? t("noCompletedGoals") : t("noActiveGoals")}</p> :
                                    goals.filter(goal => showCompletedGoals ? goal.status === "COMPLETED" : goal.status === "INCOMPLETE").map(goal => (
                                        <div className={`goal-item${completingGoals.includes(goal.id) ? " goal-finishing" : ""}`} key={goal.id}>
                                            <div className="goal-heading">
                                                <button type="button" className={`goal-check${goal.status === "COMPLETED" || completingGoals.includes(goal.id) ? " checked" : ""}`}
                                                    disabled={completingGoals.includes(goal.id)}
                                                    aria-label={goal.status === "COMPLETED" ? t("markGoalIncomplete",{name:goal.title}) : t("markGoalCompleted",{name:goal.title})}
                                                    aria-pressed={goal.status === "COMPLETED" || completingGoals.includes(goal.id)}
                                                    onClick={() => void changeGoalStatus(goal)}>
                                                    <span className="goal-check-mark" aria-hidden="true">✓</span>
                                                </button>
                                                <strong className="goal-title">{goal.title}</strong>
                                                <button className="goal-edit-link" type="button" onClick={() => openGoalEditor(goal)}>{t("edit")}</button>
                                            </div>
                                            <div className="goal-body">
                                                <p>{goal.description}</p>
                                                <p className="goal-due">{t("target")} {formatProfileDate(goal.duration)}</p>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                            <button className="goal-show-completed" type="button" onClick={() => setShowCompletedGoals(current => !current)}>
                                {showCompletedGoals ? t("backActiveGoals") : t("completedGoalsCount",{count:goals.filter(goal => goal.status === "COMPLETED").length})}
                            </button>
                        </article>
                    </aside>
                </section>
            </div>
        </main>
    );
}

function getTimelineIcon(type: TimelineEventType) {
    switch (type) {
        case "evaluation":
            return "✓";
        case "note":
            return "✎";
        case "recognition":
            return "★";
        case "writeup":
            return "!";
        case "training":
            return "↗";
    }
}

function getTimelineLabel(type: TimelineEventType) {
    switch (type) {
        case "evaluation":
            return "Evaluation";
        case "note":
            return "Manager note";
        case "recognition":
            return "Recognition";
        case "writeup":
            return "Write-up";
        case "training":
            return "Training";
    }
}
