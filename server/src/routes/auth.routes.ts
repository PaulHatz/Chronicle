// src/routes/auth.routes.ts

import { Router } from "express";
import { login, me, logout } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/login", login);


router.use(authenticate);

// Protected routes
router.get("/me", me);
router.post("/logout", logout);

export default router;
