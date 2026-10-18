import { requireRoles } from "./auth.middleware";

export const requireAdmin = requireRoles("ADMIN");
