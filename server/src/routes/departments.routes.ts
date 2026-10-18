import { departmentBody, departmentPatch } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {requireAdmin} from "../middleware/admin.middleware";
import * as departmentController from "../controllers/departments.controller";

const router = Router();
router.use(authenticate);

router.get("/options", validateRequest(), departmentController.getDepartmentOptions);
router.get("/", requireAdmin, validateRequest(), departmentController.getDepartments);
router.post("/", requireAdmin, validateRequest(departmentBody), departmentController.addDepartment);
router.patch("/:departmentId", requireAdmin, validateRequest(departmentPatch), departmentController.modifyDepartment);
router.delete("/:departmentId", requireAdmin, validateRequest(), departmentController.removeDepartment);

export default router;

