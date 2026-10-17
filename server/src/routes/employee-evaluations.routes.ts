import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as controller from "../controllers/employee-evaluations.controller";

const router = Router();
router.use(authenticate);
router.get("/:employeeId/evaluation-form", controller.getForm);
router.get("/:employeeId/evaluations", controller.listEvaluations);
router.post("/:employeeId/evaluations", controller.submitEvaluation);
router.get("/:employeeId/evaluations/:evaluationId", controller.getEvaluation);
export default router;
