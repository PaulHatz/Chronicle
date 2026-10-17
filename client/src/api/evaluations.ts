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
  name: string; department: string; version: string;
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
  id: number; name: string; department: string; version: string;
}>> {
  return parseResponse(await apiFetch("/evaluation-templates"));
}
