import { createAuthClient } from "better-auth/react"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const authBaseUrl = apiUrl.replace(/\/api\/?$/, "");

export const authClient = createAuthClient({
    baseURL: authBaseUrl,
})
