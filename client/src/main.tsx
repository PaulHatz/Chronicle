import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { RoleProvider } from "./auth/RoleContext";
import { LanguageProvider } from "./i18n/LanguageContext";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <BrowserRouter>
        <AuthProvider>
            <RoleProvider><LanguageProvider><App /></LanguageProvider></RoleProvider>
        </AuthProvider>
    </BrowserRouter>
);