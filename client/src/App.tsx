import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeePage";
import EmployeesPage from "./pages/EmployeesPage";
import EvaluationTemplatesPage from "./pages/EvaluationTemplatesPage";
import EvaluationTemplatesListPage from "./pages/EvaluationTemplatesListPage";
import EvaluationTemplateDetailPage from "./pages/EvaluationTemplateDetailPage";
import AppLayout from "./layout/AppLayout";
import DepartmentsPage from "./pages/DepartmentsPage";
export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={ <LoginPage /> }
            />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route
                    path="/"
                    element={<DashboardPage />}
                />

                <Route
                    path="/employees"
                    element={ <EmployeesPage /> }
                />
                 <Route
                    path="/employees/:employeeId"
                    element={<EmployeePage />}
                />
                <Route path="/departments" element={<DepartmentsPage />} />
                <Route path="/evaluation-templates" element={<EvaluationTemplatesListPage />} />
                <Route path="/evaluation-templates/new" element={<EvaluationTemplatesPage />} />
                <Route path="/evaluation-templates/:templateId" element={<EvaluationTemplateDetailPage />} />
              </Route>
            </Route>

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}