import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { RoleProvider } from "./auth/RoleContext";
import { ThemeProvider } from "./theme/ThemeContext";
import "./theme/dark.css";
import { LanguageProvider } from "./i18n/LanguageContext";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <BrowserRouter>
        <AuthProvider>
            <RoleProvider><ThemeProvider><LanguageProvider><App /></LanguageProvider></ThemeProvider></RoleProvider>
        </AuthProvider>
    </BrowserRouter>
);