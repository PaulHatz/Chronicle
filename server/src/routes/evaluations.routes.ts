import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {requireAdmin} from "../middleware/admin.middleware";
import * as controller from "../controllers/evaluations.controller";

const router = Router();
// This router is mounted at /api: guard only its own routes.

router.post("/evaluation-templates", authenticate, requireAdmin, controller.createTemplate);
router.get("/evaluation-templates", authenticate, requireAdmin, controller.listTemplates);
router.get("/evaluation-templates/:templateId", authenticate, requireAdmin, controller.getTemplate);
router.post("/evaluation-templates/:templateId/questions", authenticate, requireAdmin, controller.createQuestion);
router.get("/evaluation-templates/:templateId/questions", authenticate, requireAdmin, controller.getQuestions);
router.patch("/evaluation-questions/:questionId", authenticate, requireAdmin, controller.updateQuestion);
router.delete("/evaluation-questions/:questionId", authenticate, requireAdmin, controller.deleteQuestion);

export default router;

