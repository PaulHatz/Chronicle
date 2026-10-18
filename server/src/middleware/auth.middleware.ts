import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

export const accountRoles = ["ADMIN", "MANAGER", "TEAM_LEADER"] as const;
export type AccountRole = typeof accountRoles[number];
export interface JwtPayload {
    id: number;
    email: string;
    role: AccountRole;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
    sessionId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    // Never reuse caller-supplied identity or authorization claims from a token.
    delete req.user;
    delete req.sessionId;
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? "");
    if (!match) return res.status(401).json({ message: "Invalid or missing authorization header." });
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ message: "Authentication is not configured." });

    let id: number;
    let sessionId: string;
    try {
        const decoded = jwt.verify(match[1], secret, { algorithms: ["HS256"] });
        if (typeof decoded !== "object" || !Number.isSafeInteger(decoded.id) || decoded.id <= 0 ||
            typeof decoded.jti !== "string" || !/^[0-9a-f-]{36}$/i.test(decoded.jti) ||
            typeof decoded.exp !== "number") {
            return res.status(401).json({ message: "Invalid or expired token." });
        }
        id = decoded.id;
        sessionId = decoded.jti;
    } catch {
        return res.status(401).json({ message: "Invalid or expired token." });
    }

    try {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            select: { userId: true, expiresAt: true, user: { select: { id: true, email: true, role: true } } },
        });
        if (!session || session.userId !== id || session.expiresAt.getTime() <= Date.now() || !session.user) {
            return res.status(401).json({ message: "Session expired or revoked. Please sign in again." });
        }
        const user = session.user;
        if (!accountRoles.includes(user.role)) return res.status(403).json({ message: "Access denied." });
        req.user = user;
        req.sessionId = sessionId;
    } catch (error) {
        console.error("Unable to verify account permissions.", error);
        return res.status(503).json({ message: "Unable to verify permissions." });
    }
    return next();
}

// Must run after authenticate: roles are loaded from the database for this request.
export function requireRoles(...roles: AccountRole[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ message: "Not authenticated." });
        if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Access denied." });
        return next();
    };
}
