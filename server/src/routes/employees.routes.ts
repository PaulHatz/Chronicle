import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getemployeelist, getemployee } from "../controllers/employees.controller";

const router = Router();

router.use(authenticate);

router.use("/getemployeelist", getemployeelist);
router.use("/:employeeId", getemployee);

export default router;