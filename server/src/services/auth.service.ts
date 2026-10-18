import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma";

export async function loginUser(email: string, password: string) {
    
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return {success: 0 };
    }

    const valid = await argon2.verify(
        user.passwordHash,
        password
    );

    if (!valid) {
        return {
            success: 0
        };
    }

    const sessionId = randomUUID();
    const expiresAt = new Date((Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60) * 1000);
    const token = jwt.sign(
        { id: user.id, jti: sessionId, exp: Math.floor(expiresAt.getTime() / 1000) },
        process.env.JWT_SECRET!,
        { algorithm: "HS256" }
    );
    // Never return a token unless its revocable session was persisted.
    await prisma.session.create({ data: { id: sessionId, userId: user.id, expiresAt } });

    return { 
        user: { firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, language: user.language, darkMode: user.darkMode },
        token: token,
        success: 1
    };
}

export async function getCurrentUser(userId: number) {
    return prisma.user.findUnique({
        where: {
            id: userId
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            language: true,
            darkMode: true,
            createdAt: true
        }
    });
}


export async function revokeSession(sessionId: string, userId: number) {
    await prisma.session.deleteMany({ where: { id: sessionId, userId } });
}
