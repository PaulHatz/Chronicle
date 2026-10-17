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