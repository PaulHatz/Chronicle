import { apiFetch } from "./client";

export async function getemployeelist() {

    const response = await apiFetch(
        "/employees/getemployeelist", 
        {
            method: "GET"
        }
    );

    return response.json();

}

export async function getemployee(id) {
    const response = await apiFetch(
        "/employees/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}

export async function addemployee(newEmployee) {
    return apiFetch("/employees/add", {
        method: "POST",
        body: JSON.stringify(newEmployee),
    });
}

export async function getemployeenotes(id) {
    const response = await apiFetch(
        "/activity/notes/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}

export async function getemployeewriteups(id) {
    const response = await apiFetch(
        "/activity/writeup/" + String(id), 
        {
            method: "GET"
        }
    );

    return response.json();
}