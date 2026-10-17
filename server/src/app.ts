import express from "express";
import cors from "cors";




import authRoutes from "./routes/auth.routes";

import employeesRoutes from "./routes/employees.routes";

import activityRoutes from "./routes/activity.routes";
import evaluationRoutes from "./routes/evaluations.routes";
import departmentRoutes from "./routes/departments.routes";
import employeeEvaluationRoutes from "./routes/employee-evaluations.routes";

const app = express();

app.use(cors());

app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/api/employees", employeesRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api", evaluationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeEvaluationRoutes);


app.get("/", (req, res) => {
    res.send("Chronicle API");
});





export default app;