import { useState, type FormEvent } from "react";


import "./LoginPage.css";
import {useLanguage} from "../i18n/LanguageContext";

import { login } from "../api/auth";

export default function LoginPage() {
    const {t}=useLanguage();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        
        try {
            const result = await login(
                email,
                password
            );

            localStorage.setItem(
                "token",
                result.token
            );
            alert(result.user.firstName);
            alert (result.token);

            // navigate("/dashboard");

        } catch(err) {

            alert("Login failed." + err);

        }
    }

    console.log("Were here LoginPage.tsx");


    return (
        <main className="login-page">
            <section className="login-brand">
                <div className="brand-content">
                    <div className="brand-logo">C</div>

                    <h1>Chronicle</h1>

                    <p>
                        {t("loginDescription")}
                    </p>

                    <div className="brand-features">
                        <div>
                            <span>✓</span>
                            {t("performanceTimelines")}
                        </div>

                        <div>
                            <span>✓</span>
                            {t("structuredEvaluations")}
                        </div>

                        <div>
                            <span>✓</span>
                            {t("secureDocumentation")}
                        </div>
                    </div>
                </div>
            </section>

            <section className="login-panel">
                <form className="login-card" onSubmit={handleSubmit}>
                    <div className="mobile-logo">
                        <div className="brand-logo">C</div>
                        <span>Chronicle</span>
                    </div>

                    <header className="login-header">
                        <p className="eyebrow">{t("welcomeBack")}</p>
                        <h2>{t("signIn")}</h2>
                        <p>
                            {t("enterCredentials")}
                        </p>
                    </header>

                    <div className="form-group">
                        <label htmlFor="email">{t("emailAddress")}</label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="manager@example.com"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <div className="password-label">
                            <label htmlFor="password">{t("password")}</label>

                            <button
                                className="forgot-password"
                                type="button"
                            >
                                {t("forgotPassword")}
                            </button>
                        </div>

                        <div className="password-input">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder={t("enterPassword")}
                                value={password}
                                onChange={(event) =>
                                    setPassword(event.target.value)
                                }
                                autoComplete="current-password"
                                required
                            />

                            <button
                                className="show-password"
                                type="button"
                                onClick={() =>
                                    setShowPassword((current) => !current)
                                }
                                aria-label={
                                    showPassword
                                        ? "Hide password"
                                        : "Show password"
                                }
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                    </div>

                    <label className="remember-me">
                        <input type="checkbox" />
                        <span>{t("rememberMe")}</span>
                    </label>

                    <button className="login-button" type="submit">
                        Sign in
                    </button>

                    <p className="login-footer">
                        {t("loginFooter")}
                    </p>
                </form>
            </section>
        </main>
    );
}