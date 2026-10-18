// src/routes/auth.routes.ts

import { Router } from "express";
import { login, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

// Public routes
router.post("/login", login);


router.use(authenticate);

// Protected routes
router.get("/me", me);

export default router;
