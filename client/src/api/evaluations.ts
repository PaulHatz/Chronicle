import { apiFetch } from "./client";

export type NewQuestion = {
  questionText: string;
  questionType: "NUMERIC" | "TEXT";
  minScore: number | null;
  maxScore: number | null;
  rubric: Record<string, string> | null;
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === "object" && "message" in body
      ? String(body.message) : `Request failed (${response.status})`;
    throw new Error(message);
  }
  return body as T;
}

export async function createEvaluationTemplate(input: {
  name: string; version: string;
}): Promise<{ id: number }> {
  return parseResponse(await apiFetch("/evaluation-templates", {
    method: "POST", body: JSON.stringify(input),
  }));
}

export async function addEvaluationQuestion(templateId: number, input: NewQuestion) {
  return parseResponse(await apiFetch(`/evaluation-templates/${templateId}/questions`, {
    method: "POST", body: JSON.stringify(input),
  }));
}

export async function getEvaluationTemplates(): Promise<Array<{
  id: number; name: string; version: string;
}>> {
  return parseResponse(await apiFetch("/evaluation-templates"));
}

export type EvaluationQuestion = NewQuestion & { id: number; evaluationTemplateId: number };
export type EvaluationTemplateDetail = {
  id: number;
  name: string;
  version: string;
  questions: EvaluationQuestion[];
};

export async function getEvaluationTemplate(id: number): Promise<EvaluationTemplateDetail> {
  return parseResponse(await apiFetch(`/evaluation-templates/${id}`));
}

export async function updateEvaluationQuestion(id: number, input: NewQuestion): Promise<EvaluationQuestion> {
  return parseResponse(await apiFetch(`/evaluation-questions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  }));
}

export async function deleteEvaluationQuestion(id: number): Promise<void> {
  const response = await apiFetch(`/evaluation-questions/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message = body && typeof body === "object" && "message" in body
      ? String(body.message) : `Delete failed (${response.status})`;
    throw new Error(message);
  }
}
