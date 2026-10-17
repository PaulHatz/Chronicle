import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

export class EvaluationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

type AnswerInput = { questionId: number; scoreAnswer: number | null; textAnswer: string | null };

export async function getEmployeeEvaluationForm(employeeId: number) {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: { department: { include: { evaluationTemplate: {
      include: { questions: { orderBy: { id: "asc" } } },
    } } } },
  });
  if (!employee) throw new EvaluationError(404, "Employee not found.");
  const template = employee.department.evaluationTemplate;
  return {
    employee: { id: employee.id, firstName: employee.firstName, lastName: employee.lastName, department: employee.department.name },
    template: { id: template.id, name: template.name, version: template.version, questions: template.questions },
  };
}

export async function completeEmployeeEvaluation(employeeId: number, answers: AnswerInput[]) {
  // Validate against the server-side question definitions, not client-supplied rubrics.
  return prisma.$transaction(async tx => {
    const employee = await tx.employee.findUnique({
      where: { id: employeeId },
      include: { department: { include: { evaluationTemplate: { include: { questions: true } } } } },
    });
    if (!employee) throw new EvaluationError(404, "Employee not found.");
    const template = employee.department.evaluationTemplate;
    if (template.questions.length === 0) throw new EvaluationError(400, "This template has no questions.");
    const expected = new Map(template.questions.map(q => [q.id, q]));
    const unique = new Set<number>();
    if (answers.length !== expected.size) throw new EvaluationError(400, "Every question must have one answer.");
    for (const answer of answers) {
      const q = expected.get(answer.questionId);
      if (!q || unique.has(answer.questionId)) throw new EvaluationError(400, "Invalid or duplicate question.");
      unique.add(answer.questionId);
      if (q.questionType === "NUMERIC") {
        if (typeof answer.scoreAnswer !== "number" || !Number.isInteger(answer.scoreAnswer) ||
            q.minScore === null || q.maxScore === null ||
            answer.scoreAnswer < q.minScore || answer.scoreAnswer > q.maxScore) {
          throw new EvaluationError(400, "Score is outside the permitted range.");
        }
      } else if (q.questionType === "TEXT") {
        if (typeof answer.textAnswer !== "string" || !answer.textAnswer.trim()) {
          throw new EvaluationError(400, "Written answers cannot be blank.");
        }
        if (answer.scoreAnswer !== null) throw new EvaluationError(400, "Text-only questions cannot contain scores.");
      } else throw new EvaluationError(400, "Unsupported question type.");
      if (answer.textAnswer !== null && typeof answer.textAnswer !== "string") throw new EvaluationError(400, "Invalid written response.");
    }
    const completedAt = new Date();
    const nextEvaluationAt = new Date(completedAt);
    nextEvaluationAt.setUTCDate(nextEvaluationAt.getUTCDate() + employee.department.evaluationFrequencyDays);
    const evaluation = await tx.evaluation.create({
      data: {
        employeeId,
        completedAt,
        evaluationTemplateId: template.id,
        answers: { create: answers.map(a => ({
          evaluationQuestionId: a.questionId,
          scoreAnswer: a.scoreAnswer,
          textAnswer: a.textAnswer,
        })) },
      },
      include: { answers: true },
    });
    await tx.employee.update({ where: { id: employeeId }, data: { nextEvaluationAt } });
    return evaluation;
  });
}

export async function listEmployeeEvaluations(employeeId: number) {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true } });
  if (!employee) throw new EvaluationError(404, "Employee not found.");
  return prisma.evaluation.findMany({
    where: { employeeId },
    orderBy: { completedAt: "desc" },
    include: { template: { select: { id: true, name: true, version: true } }, answers: {
      include: { question: { select: { questionText: true, questionType: true, rubric: true, minScore: true, maxScore: true } } },
    } },
  });
}
