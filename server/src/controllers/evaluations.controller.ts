import { Request, Response } from "express";
import * as service from "../services/evaluations.service";

function idFrom(value: string | string[] | undefined): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw new service.ApiError(400, "Invalid ID.");
  return id;
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new service.ApiError(400, "Expected a JSON object.");
  }
  return value as Record<string, unknown>;
}

function allowed(body: Record<string, unknown>, keys: string[]) {
  if (Object.keys(body).some(k => !keys.includes(k))) {
    throw new service.ApiError(400, "Unexpected request field.");
  }
}

function nonempty(value: unknown, key: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new service.ApiError(400, key + " must be a nonempty string.");
  }
  return value.trim();
}

function parseTemplate(value: unknown): service.TemplateInput {
  const b = object(value);
  allowed(b, ["name", "version"]);
  return {
    name: nonempty(b.name, "name"),
    version: nonempty(b.version, "version"),
  };
}

function score(value: unknown, key: string): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value)) {
    throw new service.ApiError(400, key + " must be an integer or null.");
  }
  return value as number;
}

function parseQuestion(value: unknown, partial = false): Partial<service.QuestionInput> {
  const b = object(value);
  const keys = ["questionText", "questionType", "minScore", "maxScore", "rubric"];
  allowed(b, keys);
  if (partial && Object.keys(b).length === 0) {
    throw new service.ApiError(400, "Provide at least one field.");
  }
  if (!partial && (b.questionText === undefined || b.questionType === undefined)) {
    throw new service.ApiError(400, "questionText and questionType are required.");
  }
  const data: Partial<service.QuestionInput> = {};
  if ("questionText" in b) data.questionText = nonempty(b.questionText, "questionText");
  if ("questionType" in b) {
    if (b.questionType !== "NUMERIC" && b.questionType !== "TEXT") {
      throw new service.ApiError(400, "questionType must be NUMERIC or TEXT.");
    }
    data.questionType = b.questionType;
  }
  if ("minScore" in b) data.minScore = score(b.minScore, "minScore");
  if ("maxScore" in b) data.maxScore = score(b.maxScore, "maxScore");
  if ("rubric" in b) {
    if (b.rubric === null) data.rubric = null;
    else {
      const r = object(b.rubric);
      if (Object.values(r).some(v => typeof v !== "string")) {
        throw new service.ApiError(400, "Rubric values must be strings.");
      }
      data.rubric = r as Record<string, string>;
    }
  }
  return data;
}

function validateQuestion(data: service.QuestionInput) {
  if (data.questionType === "NUMERIC") {
    if (data.minScore === null || data.maxScore === null ||
        data.minScore > data.maxScore) {
      throw new service.ApiError(400, "Numeric questions require valid minScore and maxScore.");
    }
  } else if (data.minScore !== null || data.maxScore !== null) {
    throw new service.ApiError(400, "Text questions must have null minScore and maxScore.");
  }
}

function handle(error: unknown, res: Response) {
  if (error instanceof service.ApiError) {
    return res.status(error.status).json({ message: error.message });
  }
  console.error(error);
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Record not found." });
    if (error.code === "P2003") return res.status(409).json({ message: "Referenced record prevents this operation." });
  }
  return res.status(500).json({ message: "Internal server error." });
}

export async function createTemplate(req: Request, res: Response) {
  try {
    const created = await service.createTemplate(parseTemplate(req.body));
    return res.status(201).json(created);
  } catch (e) { return handle(e, res); }
}
export async function listTemplates(req: Request, res: Response) {
  try {
    return res.json(await service.listTemplates());
  } catch (e) { return handle(e, res); }
}
export async function getTemplate(req: Request, res: Response) {
  try {
    const result = await service.getTemplate(idFrom(req.params.templateId));
    if (!result) return res.status(404).json({ message: "Template not found." });
    return res.json(result);
  } catch (e) { return handle(e, res); }
}
export async function getQuestions(req: Request, res: Response) {
  try {
    return res.json(await service.getQuestions(idFrom(req.params.templateId)));
  } catch (e) { return handle(e, res); }
}
export async function createQuestion(req: Request, res: Response) {
  try {
    const parsed = parseQuestion(req.body);
    const data: service.QuestionInput = {
      questionText: parsed.questionText!,
      questionType: parsed.questionType!,
      minScore: parsed.minScore ?? null,
      maxScore: parsed.maxScore ?? null,
      rubric: parsed.rubric ?? null,
    };
    validateQuestion(data);
    return res.status(201).json(await service.createQuestion(idFrom(req.params.templateId), data));
  } catch (e) { return handle(e, res); }
}
export async function updateQuestion(req: Request, res: Response) {
  try {
    const id = idFrom(req.params.questionId);
    const changes = parseQuestion(req.body, true);
    // Service blocks edits once a template is used; fields are validated before Prisma writes.
    if (changes.minScore !== undefined && changes.maxScore !== undefined &&
        changes.minScore !== null && changes.maxScore !== null &&
        changes.minScore > changes.maxScore) {
      throw new service.ApiError(400, "minScore cannot exceed maxScore.");
    }
    return res.json(await service.updateQuestion(id, changes));
  } catch (e) { return handle(e, res); }
}
export async function deleteQuestion(req: Request, res: Response) {
  try {
    await service.deleteQuestion(idFrom(req.params.questionId));
    return res.status(204).send();
  } catch (e) { return handle(e, res); }
}
