import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getemployeelist, getemployee, addemployee } from "../controllers/employees.controller";

const router = Router();

router.use(authenticate);
router.post("/add", addemployee);
router.get("/getemployeelist", getemployeelist);
router.get("/:employeeId", getemployee);



export default router;