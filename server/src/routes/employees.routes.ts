import { employeeBody } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getemployeelist, getemployee, addemployee, updateEmployee } from "../controllers/employees.controller";

const router = Router();

router.use(authenticate);
router.post("/add", validateRequest(employeeBody), addemployee);
router.get("/getemployeelist", validateRequest(), getemployeelist);
router.get("/:employeeId", validateRequest(), getemployee);
router.patch("/:employeeId", validateRequest(employeeBody), updateEmployee);



export default router;
