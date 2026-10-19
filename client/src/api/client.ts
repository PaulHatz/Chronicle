// Node-based tests do not provide Vite's import.meta.env object.
const API_URL = import.meta.env?.VITE_API_URL ?? (import.meta.env?.DEV === false ? "/api" : "http://localhost:3000/api");
/*
export async function apiFetch(
    endpoint: string,
    options: RequestInit = {}
) {
    const token = localStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        cache: "no-store",
        ...(token && {
            Authorization: `Bearer ${token}`,
        }),
        ...options.headers,
        
    };

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers,
        }
    );

    return response;
}*/

export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
) {
    const token = localStorage.getItem("token");

    const headers = new Headers(options.headers);

    headers.set("Content-Type", "application/json");
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }
    if (
        options.body !== undefined &&
        typeof options.body !== "string"
    ) {
        throw new Error(
            `apiFetch received a non-string body: ${typeof options.body}`,
        );
    }
    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
}
/*
export async function apiFetch(
    endpoint: string,
    options: RequestInit = {},
    jsonBody?: unknown,
) {
    const token = localStorage.getItem("token");

    const headers = new Headers(options.headers);

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (jsonBody !== undefined) {
        headers.set("Content-Type", "application/json");
    }

    const body =
        jsonBody === undefined
            ? options.body
            : JSON.stringify(jsonBody);

    console.log("Outgoing body:", body);
    console.log("Outgoing body type:", typeof body);

    console.log({
        endpoint,
        body,
        bodyType: typeof body,
        headers: Object.fromEntries(headers.entries()),
    });

    return fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        body,
    });
}*/