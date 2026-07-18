import { Request, Response } from "express";
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
                message: result.message
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