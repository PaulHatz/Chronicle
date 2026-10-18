import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {requireAdmin} from "../middleware/admin.middleware";
import * as departmentController from "../controllers/departments.controller";

const router = Router();
router.use(authenticate);

router.get("/", departmentController.getDepartments);
router.post("/", requireAdmin, departmentController.addDepartment);
router.patch("/:departmentId", requireAdmin, departmentController.modifyDepartment);
router.delete("/:departmentId", requireAdmin, departmentController.removeDepartment);

export default router;
