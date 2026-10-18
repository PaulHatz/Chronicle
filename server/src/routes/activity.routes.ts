import { noteBody, writeUpBody } from "../validation/schemas";
import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import * as records from "../controllers/employee-records.controller";
const router = Router();
router.use(authenticate);
router.get("/notes/:employeeId", validateRequest(), records.notes);
router.post("/notes/:employeeId", validateRequest(noteBody), records.addNote);
router.get("/writeup/:employeeId", validateRequest(), records.writeUps);
router.post("/writeup/:employeeId", validateRequest(writeUpBody), records.addWriteUp);
router.patch("/writeup/:employeeId/:writeUpId/resolve", validateRequest(), records.resolveWriteUp);
export default router;

