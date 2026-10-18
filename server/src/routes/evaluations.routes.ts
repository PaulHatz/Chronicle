import { questionBody, questionPatch, templateBody } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {requireAdmin} from "../middleware/admin.middleware";
import * as controller from "../controllers/evaluations.controller";

const router = Router();
// This router is mounted at /api: guard only its own routes.

router.post("/evaluation-templates", authenticate, requireAdmin, validateRequest(templateBody), controller.createTemplate);
router.get("/evaluation-templates", authenticate, requireAdmin, validateRequest(), controller.listTemplates);
router.get("/evaluation-templates/:templateId", authenticate, requireAdmin, validateRequest(), controller.getTemplate);
router.post("/evaluation-templates/:templateId/questions", authenticate, requireAdmin, validateRequest(questionBody), controller.createQuestion);
router.get("/evaluation-templates/:templateId/questions", authenticate, requireAdmin, validateRequest(), controller.getQuestions);
router.patch("/evaluation-questions/:questionId", authenticate, requireAdmin, validateRequest(questionPatch), controller.updateQuestion);
router.delete("/evaluation-questions/:questionId", authenticate, requireAdmin, validateRequest(), controller.deleteQuestion);

export default router;

