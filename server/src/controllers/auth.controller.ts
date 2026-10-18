import { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth.middleware";
import * as authService from "../services/auth.service";

export async function login(req: Request, res: Response) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required."
            });
        }

        const result = await authService.loginUser(email, password);

        if (!result.success) {
            return res.status(401).json({
                message: "Invalid email or password."
            });
        }


        return res.status(200).json({
            token: result.token,
            user: result.user
        });

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
}

export async function me(
    req: AuthRequest,
    res: Response
) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: "Not authenticated."
            });
        }
        const user = await authService.getCurrentUser(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        return res.json(user);

    } catch (err) {
        console.error(err);

        return res.status(500).json({
            message: "Internal server error."
        });
    }
}

export async function logout(req: AuthRequest, res: Response) {
    if (!req.user || !req.sessionId) return res.status(401).json({ message: "Not authenticated." });
    try {
        await authService.revokeSession(req.sessionId, req.user.id);
        return res.status(204).send();
    } catch (error) {
        console.error("Unable to revoke session.", error);
        return res.status(503).json({ message: "Unable to sign out. Please try again." });
    }
}
