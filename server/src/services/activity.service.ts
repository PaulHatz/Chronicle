import { prisma } from "../lib/prisma";
export async function getManagerNotesForEmployeeId(id: number) {
    const notes =  await prisma.managerNote.findMany({
        where: { employeeId: Number(id) }
    });

    return notes;
}

export async function getWriteUpsForEmployeeId(id: number) {
    const notes =  await prisma.writeUp.findMany({
        where: { employeeId: Number(id) }
    });

    return notes;
}

