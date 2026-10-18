import { prisma } from "../lib/prisma";
export async function getRecentActivity(limit = 8) {
  const [evaluations, notes, writeUps] = await Promise.all([
    prisma.evaluation.findMany({
      orderBy: { completedAt: "desc" }, take: limit,
      select: { id: true, completedAt: true, template: { select: { name: true } },
        employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.managerNote.findMany({
      orderBy: { createdAt: "desc" }, take: limit,
      select: { id: true, title: true, type: true, createdAt: true,
        employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
    prisma.writeUp.findMany({
      orderBy: { createdAt: "desc" }, take: limit,
      select: { id: true, type: true, createdAt: true,
        employee: { select: { id: true, firstName: true, lastName: true } } },
    }),
  ]);
  const events = [
    ...evaluations.map(e => ({ id: `evaluation-${e.id}`, recordId: e.id, employeeId: e.employee.id,
      employee: `${e.employee.firstName} ${e.employee.lastName}`, initials: `${e.employee.firstName[0] ?? ""}${e.employee.lastName[0] ?? ""}`.toUpperCase(),
      action: "Evaluation completed", detail: e.template.name, occurredAt: e.completedAt, type: "evaluation" as const })),
    ...notes.map(n => ({ id: `note-${n.id}`, recordId: n.id, employeeId: n.employee.id,
      employee: `${n.employee.firstName} ${n.employee.lastName}`, initials: `${n.employee.firstName[0] ?? ""}${n.employee.lastName[0] ?? ""}`.toUpperCase(),
      action: n.type === "POSITIVE" ? "Positive note added" : n.type === "IMPROVEMENT" ? "Improvement note added" : "Manager note added", detail: n.title, occurredAt: n.createdAt, type: "note" as const })),
    ...writeUps.map(w => ({ id: `writeup-${w.id}`, recordId: w.id, employeeId: w.employee.id,
      employee: `${w.employee.firstName} ${w.employee.lastName}`, initials: `${w.employee.firstName[0] ?? ""}${w.employee.lastName[0] ?? ""}`.toUpperCase(),
      action: "Write-up created", detail: w.type.replace(/_/g, " ").toLowerCase(), occurredAt: w.createdAt, type: "writeup" as const })),
  ];
  return events.sort((a,b) => b.occurredAt.getTime() - a.occurredAt.getTime()).slice(0, limit);
}

