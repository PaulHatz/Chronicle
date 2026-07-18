import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getemployeelist } from "../controllers/employees.controller";

const router = Router();

router.use(authenticate);

router.use("/getemployeelist", getemployeelist);

export default router;