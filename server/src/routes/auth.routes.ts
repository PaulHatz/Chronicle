import { loginBody } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
// src/routes/auth.routes.ts

import { Router } from "express";
import { login, me, logout } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/login", validateRequest(loginBody), login);


router.use(authenticate);

// Protected routes
router.get("/me", validateRequest(), me);
router.post("/logout", validateRequest(), logout);

export default router;
