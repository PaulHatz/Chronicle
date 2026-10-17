import "dotenv/config";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

export type TemplateInput = { name: string; version: string };
export type QuestionInput = {
  questionText: string;
  questionType: "NUMERIC" | "TEXT";
  minScore: number | null;
  maxScore: number | null;
  rubric: Record<string, string> | null;
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function ensureEditable(templateId: number) {
  const template = await prisma.evaluationTemplate.findUnique({
    where: { id: templateId }, select: { id: true },
  });
  if (!template) throw new ApiError(404, "Evaluation template not found.");
  const used = await prisma.evaluation.count({
    where: { evaluationTemplateId: templateId },
  });
  if (used > 0) {
    throw new ApiError(409, "This template has evaluations. Create a new template version rather than changing its questions.");
  }
}

export function createTemplate(data: TemplateInput) {
  return prisma.evaluationTemplate.create({ data });
}

export function listTemplates() {
  return prisma.evaluationTemplate.findMany({
    orderBy: { id: "desc" },
  });
}

export function getTemplate(id: number) {
  return prisma.evaluationTemplate.findUnique({
    where: { id },
    include: { questions: { orderBy: { id: "asc" } } },
  });
}

export async function getQuestions(templateId: number) {
  const template = await prisma.evaluationTemplate.findUnique({
    where: { id: templateId }, select: { id: true },
  });
  if (!template) throw new ApiError(404, "Evaluation template not found.");
  return prisma.evaluationQuestion.findMany({
    where: { evaluationTemplateId: templateId },
    orderBy: { id: "asc" },
  });
}

function questionData(data: QuestionInput) {
  return {
    questionText: data.questionText,
    questionType: data.questionType,
    minScore: data.minScore,
    maxScore: data.maxScore,
    rubric: data.rubric === null ? Prisma.JsonNull : data.rubric,
  };
}

export async function createQuestion(templateId: number, data: QuestionInput) {
  await ensureEditable(templateId);
  return prisma.evaluationQuestion.create({
    data: { evaluationTemplateId: templateId, ...questionData(data) },
  });
}

export async function updateQuestion(id: number, changes: Partial<QuestionInput>) {
  const current = await prisma.evaluationQuestion.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Evaluation question not found.");
  await ensureEditable(current.evaluationTemplateId);

  const nextType = changes.questionType ?? current.questionType;
  const nextMin = changes.minScore !== undefined ? changes.minScore : current.minScore;
  const nextMax = changes.maxScore !== undefined ? changes.maxScore : current.maxScore;
  if (nextType === "NUMERIC") {
    if (nextMin === null || nextMax === null || nextMin > nextMax) {
      throw new ApiError(400, "Numeric questions require valid minScore and maxScore.");
    }
  } else if (nextMin !== null || nextMax !== null) {
    throw new ApiError(400, "Text questions must have null minScore and maxScore.");
  }

  return prisma.evaluationQuestion.update({
    where: { id },
    data: {
      ...("questionText" in changes && { questionText: changes.questionText }),
      ...("questionType" in changes && { questionType: changes.questionType }),
      ...("minScore" in changes && { minScore: changes.minScore }),
      ...("maxScore" in changes && { maxScore: changes.maxScore }),
      ...("rubric" in changes && {
        rubric: changes.rubric === null ? Prisma.JsonNull : changes.rubric,
      }),
    },
  });
}

export async function deleteQuestion(id: number) {
  const current = await prisma.evaluationQuestion.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Evaluation question not found.");
  await ensureEditable(current.evaluationTemplateId);

  const answerCount = await prisma.evaluationAnswer.count({
    where: { evaluationQuestionId: id },
  });
  if (answerCount > 0) throw new ApiError(409, "Cannot delete a question that has answers.");

  await prisma.evaluationQuestion.delete({ where: { id } });
}
