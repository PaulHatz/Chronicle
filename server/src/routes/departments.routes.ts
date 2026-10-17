import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as departmentController from "../controllers/departments.controller";

const router = Router();
router.use(authenticate);

router.get("/", departmentController.getDepartments);
router.post("/", departmentController.addDepartment);
router.patch("/:departmentId", departmentController.modifyDepartment);
router.delete("/:departmentId", departmentController.removeDepartment);

export default router;
