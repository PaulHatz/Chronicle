import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import RequireRole from "./auth/RequireRole";
import AppLayout from "./layout/AppLayout";
import SettingsLayout from "./layout/SettingsLayout";
import PageLoading from "./components/PageLoading";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const EmployeePage = lazy(() => import("./pages/EmployeePage"));
const EmployeesPage = lazy(() => import("./pages/EmployeesPage"));
const EvaluationTemplatesPage = lazy(() => import("./pages/EvaluationTemplatesPage"));
const EvaluationTemplatesListPage = lazy(() => import("./pages/EvaluationTemplatesListPage"));
const EvaluationTemplateDetailPage = lazy(() => import("./pages/EvaluationTemplateDetailPage"));
const DepartmentsPage = lazy(() => import("./pages/DepartmentsPage"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const LanguageSettingsPage = lazy(() => import("./pages/LanguageSettingsPage"));
const AppearanceSettingsPage = lazy(() => import("./pages/AppearanceSettingsPage"));
const EmployeeEvaluationPage = lazy(() => import("./pages/EmployeeEvaluationPage"));
const EmployeeEvaluationResultPage = lazy(() => import("./pages/EmployeeEvaluationResultPage"));
export default function App() {
    return (
        <Suspense fallback={<PageLoading />}>
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
                <Route path="/employees/:employeeId/evaluate" element={<EmployeeEvaluationPage />} />
                <Route path="/employees/:employeeId/evaluations/:evaluationId" element={<EmployeeEvaluationResultPage />} />
                <Route element={<SettingsLayout />}>
                  <Route path="/settings" element={<Navigate to="/settings/language" replace />} />
                  <Route path="/settings/language" element={<LanguageSettingsPage />} />
                  <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
                  <Route element={<RequireRole allow={["ADMIN","MANAGER"]} />}><Route path="/users" element={<UsersPage />} /></Route>
                  <Route element={<RequireRole allow={["ADMIN"]} />}>
                    <Route path="/departments" element={<DepartmentsPage />} />
                    <Route path="/evaluation-templates" element={<EvaluationTemplatesListPage />} />
                    <Route path="/evaluation-templates/new" element={<EvaluationTemplatesPage />} />
                    <Route path="/evaluation-templates/:templateId" element={<EvaluationTemplateDetailPage />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
        </Suspense>
    );
}