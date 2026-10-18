import { validateRequest } from "../middleware/validation.middleware";
import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { getRecentActivity } from "../services/dashboard.service";

const router = Router();
router.use(authenticate);
router.get("/recent-activity", validateRequest(), async (_req, res) => {
  try { return res.json(await getRecentActivity()); }
  catch (error) { console.error(error); return res.status(500).json({ message: "Unable to load recent activity." }); }
});
export default router;

