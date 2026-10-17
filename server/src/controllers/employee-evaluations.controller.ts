import { Request, Response } from "express";
import * as service from "../services/employee-evaluations.service";

function idFrom(raw: string | string[] | undefined) {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new service.EvaluationError(400, "Invalid employee ID.");
  return id;
}
function respondError(error: unknown, res: Response) {
  if (error instanceof service.EvaluationError) return res.status(error.status).json({ message: error.message });
  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
}
export async function getForm(req: Request, res: Response) {
  try { return res.json(await service.getEmployeeEvaluationForm(idFrom(req.params.employeeId))); }
  catch (error) { return respondError(error, res); }
}
export async function listEvaluations(req: Request, res: Response) {
  try { return res.json(await service.listEmployeeEvaluations(idFrom(req.params.employeeId))); }
  catch (error) { return respondError(error, res); }
}
export async function submitEvaluation(req: Request, res: Response) {
  try {
    const body: unknown = req.body;
    if (!body || typeof body !== "object" || !("answers" in body) || !Array.isArray(body.answers)) {
      throw new service.EvaluationError(400, "Expected an answers array.");
    }
    const answers: Array<{ questionId: number; scoreAnswer: number | null; textAnswer: string | null }> = [];
    for (const item of body.answers) {
      if (!item || typeof item !== "object" ||
          !Number.isSafeInteger(item.questionId) || item.questionId <= 0 ||
          !(item.scoreAnswer === null || typeof item.scoreAnswer === "number") ||
          !(item.textAnswer === null || typeof item.textAnswer === "string")) {
        throw new service.EvaluationError(400, "Invalid answer format.");
      }
      answers.push({ questionId: item.questionId, scoreAnswer: item.scoreAnswer, textAnswer: item.textAnswer });
    }
    return res.status(201).json(await service.completeEmployeeEvaluation(idFrom(req.params.employeeId), answers));
  } catch (error) { return respondError(error, res); }
}
