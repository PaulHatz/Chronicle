import { apiFetch } from "./client";

export async function login(
    email: string,
    password: string
) {
    const response = await apiFetch(
        "/auth/login",
        {
            method: "POST",
            body: JSON.stringify({
                email,
                password,
            }),
        }
    );

    if (!response.ok) {
        throw new Error("Invalid email or password");
    }

    const data = await response.json();

    localStorage.setItem("token", data.token);

    return data;
}

// Only remove the local credential after the server confirms revocation.
export async function logout(): Promise<string | null> {
    const signingOutToken = localStorage.getItem("token");
    if (signingOutToken) {
        const response = await apiFetch("/auth/logout", {
            method: "POST", signal: AbortSignal.timeout(15000),
        });
        if (!response.ok && response.status !== 401) {
            throw new Error("Unable to sign out. Please try again.");
        }
    }
    // Preserve a newer login established by another tab while this request ran.
    if (localStorage.getItem("token") === signingOutToken) {
        localStorage.removeItem("token");
    }
    return localStorage.getItem("token");
}
