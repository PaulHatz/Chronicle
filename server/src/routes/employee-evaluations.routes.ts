import { evaluationBody } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/employee-evaluations.controller";

const router = Router();
router.use(authenticate);
router.get("/evaluation-statistics/quarter", validateRequest(), controller.quarterStatistics);
router.get("/:employeeId/evaluation-form", validateRequest(), controller.getForm);
router.get("/:employeeId/evaluations", validateRequest(), controller.listEvaluations);
router.post("/:employeeId/evaluations", validateRequest(evaluationBody), controller.submitEvaluation);
router.get("/:employeeId/evaluations/:evaluationId", validateRequest(), controller.getEvaluation);
export default router;

