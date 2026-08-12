import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getemployeenotes, getemployeewriteups } from "../controllers/activity.controller";

const router = Router();

router.use(authenticate);

router.use("/notes/:employeeId", getemployeenotes);
router.use("/writeup/:employeeId", getemployeewriteups)

export default router;