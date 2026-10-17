import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import EmployeePage from "./pages/EmployeePage";
import EmployeesPage from "./pages/EmployeesPage";
export default function App() {
    return (
        <Routes>
            <Route
                path="/login"
                element={ <LoginPage /> }
            />

            <Route element={<ProtectedRoute />}>
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
            </Route>

            <Route
                path="*"
                element={<Navigate to="/" replace />}
            />
        </Routes>
    );
}