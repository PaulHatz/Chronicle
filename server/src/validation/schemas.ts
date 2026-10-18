import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const int = z.number().int().min(-2147483648).max(2147483647);
const id = int.positive();
const email = z.string().trim().max(254).email().toLowerCase();
const password = z.string().min(12).max(256); // Never trim or transform passwords.
const role = z.enum(["ADMIN", "MANAGER", "TEAM_LEADER"]);
const language = z.enum(["fr-CA", "en-CA"]);
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
    const parsed = new Date(value + "T00:00:00.000Z");
    return Number.isFinite(parsed.getTime()) && parsed.getUTCFullYear() >= 1 && parsed.toISOString().slice(0,10) === value;
}, "Expected a real calendar date (YYYY-MM-DD).");
const nonemptyPatch = <T extends z.ZodRawShape>(shape: T) => z.object(shape).partial().strict()
    .refine(value => Object.keys(value).length > 0, "Provide at least one field.");

export const loginBody = z.object({ email, password: z.string().min(1).max(256) }).strict();
export const employeeBody = z.object({
    firstName: text(100), lastName: text(100), position: text(100),
    email: z.union([email, z.literal(""), z.null()]).optional().transform(v => v || null),
    phone: z.string().trim().max(50).nullable().optional().transform(v => v || null),
    departmentId: id, status: z.enum(["ACTIVE", "INACTIVE", "LEAVE"]), hireDate: date,
}).strict();
export type EmployeeInput = z.infer<typeof employeeBody>;
const departmentFields = { name: text(100), evaluationTemplateId: id, evaluationFrequencyDays: int.min(1).max(36500) };
export const departmentBody = z.object(departmentFields).strict();
export const departmentPatch = nonemptyPatch(departmentFields);
export const templateBody = z.object({ name: text(200), version: text(50) }).strict();
const rubric = z.record(z.string().regex(/^-?(0|[1-9]\d*)$/).max(11), text(2000))
    .refine(value => Object.keys(value).length <= 1000, "Too many rubric entries.").nullable();
const questionFields = { questionText: text(10000), questionType: z.enum(["NUMERIC", "TEXT"]),
    minScore: int.nullable(), maxScore: int.nullable(), rubric };
export const questionBody = z.object({ ...questionFields,
    minScore: questionFields.minScore.default(null), maxScore: questionFields.maxScore.default(null),
    rubric: rubric.default(null),
}).strict().refine(q => q.questionType === "NUMERIC"
    ? q.minScore !== null && q.maxScore !== null && q.minScore <= q.maxScore
    : q.minScore === null && q.maxScore === null, "Invalid score range for question type.");
export const questionPatch = nonemptyPatch(questionFields).refine(q =>
    !(typeof q.minScore === "number" && typeof q.maxScore === "number" && q.minScore > q.maxScore),
    "Minimum score cannot exceed maximum score.");
export const noteBody = z.object({title:text(200),content:text(10000),type:z.enum(["GENERAL","POSITIVE","IMPROVEMENT"]).default("GENERAL")}).strict();
export const writeUpBody = z.object({type:z.enum(["VERBAL_WARNING","WRITTEN_WARNING","FINAL_WARNING"]),reason:text(10000)}).strict();
const goalFields = {title:text(200),description:text(10000),duration:date,status:z.enum(["INCOMPLETE","COMPLETED"])};
export const goalBody = z.object({...goalFields,status:goalFields.status.default("INCOMPLETE")}).strict();
export const goalPatch = nonemptyPatch(goalFields);
export const evaluationBody = z.object({answers:z.array(z.object({
    questionId:id,scoreAnswer:int.nullable(),textAnswer:z.string().trim().max(10000).nullable(),
}).strict()).min(1).max(500).refine(answers => new Set(answers.map(a => a.questionId)).size === answers.length,
    "Duplicate question IDs are not allowed.")}).strict();
const userFields = {firstName:text(100),lastName:text(100),email,password,role,language};
export const userBody = z.object({...userFields,language:language.default("fr-CA")}).strict();
export const userPatch = nonemptyPatch(userFields);
export const languageBody = z.object({language}).strict();
export const themeBody = z.object({darkMode:z.boolean()}).strict();
