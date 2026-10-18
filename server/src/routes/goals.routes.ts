import { goalBody, goalPatch } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import {Router} from "express";
import {authenticate} from "../middleware/auth.middleware";
import * as controller from "../controllers/goals.controller";
const router=Router();
router.use(authenticate);
router.get("/:employeeId/goals", validateRequest(),controller.list);
router.post("/:employeeId/goals", validateRequest(goalBody),controller.create);
router.patch("/:employeeId/goals/:goalId", validateRequest(goalPatch),controller.update);
router.delete("/:employeeId/goals/:goalId", validateRequest(),controller.remove);
export default router;

