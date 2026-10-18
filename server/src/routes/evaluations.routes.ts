import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {requireAdmin} from "../middleware/admin.middleware";
import * as controller from "../controllers/evaluations.controller";

const router = Router();
router.use(authenticate);

router.post("/evaluation-templates", requireAdmin, controller.createTemplate);
router.get("/evaluation-templates", controller.listTemplates);
router.get("/evaluation-templates/:templateId", controller.getTemplate);
router.post("/evaluation-templates/:templateId/questions", requireAdmin, controller.createQuestion);
router.get("/evaluation-templates/:templateId/questions", controller.getQuestions);
router.patch("/evaluation-questions/:questionId", requireAdmin, controller.updateQuestion);
router.delete("/evaluation-questions/:questionId", requireAdmin, controller.deleteQuestion);

export default router;
