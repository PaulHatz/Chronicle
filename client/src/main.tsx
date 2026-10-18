import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import { AuthProvider } from "./auth/AuthContext";
import { LanguageProvider } from "./i18n/LanguageContext";

ReactDOM.createRoot(
    document.getElementById("root")!
).render(
    <BrowserRouter>
        <AuthProvider>
            <LanguageProvider><App /></LanguageProvider>
        </AuthProvider>
    </BrowserRouter>
);