import { Request, Response } from "express";
import * as service from "../services/departments.service";

function readId(raw: string | string[] | undefined): number {
  const id = Number(raw);
  if (!Number.isSafeInteger(id) || id <= 0) throw new service.DepartmentError(400, "Invalid department ID.");
  return id;
}

function readInput(value: unknown, partial = false): Partial<service.DepartmentInput> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new service.DepartmentError(400, "Expected a JSON object.");
  }
  const data = value as Record<string, unknown>;
  const allowed = ["name", "evaluationTemplateId", "evaluationFrequencyDays"];
  if (Object.keys(data).some(k => !allowed.includes(k)) || (partial && Object.keys(data).length === 0)) {
    throw new service.DepartmentError(400, "Invalid department fields.");
  }
  if (!partial && allowed.some(k => !(k in data))) {
    throw new service.DepartmentError(400, "Name, template and frequency are required.");
  }

  const result: Partial<service.DepartmentInput> = {};
  if ("name" in data) {
    if (typeof data.name !== "string" || !data.name.trim()) throw new service.DepartmentError(400, "Name is required.");
    result.name = data.name.trim();
  }
  for (const field of ["evaluationTemplateId", "evaluationFrequencyDays"] as const) {
    if (field in data) {
      const n = data[field];
      if (typeof n !== "number" || !Number.isSafeInteger(n) || n <= 0) {
        throw new service.DepartmentError(400, field + " must be a positive integer.");
      }
      result[field] = n;
    }
  }
  return result;
}

function fail(error: unknown, res: Response) {
  if (error instanceof service.DepartmentError) return res.status(error.status).json({ message: error.message });
  if (typeof error === "object" && error !== null && "code" in error) {
    if (error.code === "P2025") return res.status(404).json({ message: "Department not found." });
    if (error.code === "P2002") return res.status(409).json({ message: "Department name already exists." });
    if (error.code === "P2003") return res.status(409).json({ message: "Invalid evaluation template or referenced department." });
  }
  console.error(error);
  return res.status(500).json({ message: "Internal server error." });
}

export async function getDepartments(_req: Request, res: Response) {
  try { return res.json(await service.listDepartments()); } catch (error) { return fail(error, res); }
}

export async function addDepartment(req: Request, res: Response) {
  try {
    const data = readInput(req.body) as service.DepartmentInput;
    return res.status(201).json(await service.createDepartment(data));
  } catch (error) { return fail(error, res); }
}

export async function modifyDepartment(req: Request, res: Response) {
  try {
    return res.json(await service.updateDepartment(readId(req.params.departmentId), readInput(req.body, true)));
  } catch (error) { return fail(error, res); }
}

export async function removeDepartment(req: Request, res: Response) {
  try {
    await service.deleteDepartment(readId(req.params.departmentId));
    return res.status(204).send();
  } catch (error) { return fail(error, res); }
}


export async function getDepartmentOptions(_req: Request, res: Response) {
  try { return res.json(await service.listDepartmentOptions()); } catch (error) { return fail(error, res); }
}
