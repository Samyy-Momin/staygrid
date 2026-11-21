import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
  withCredentials: true,
});

// Setup interceptors if needed later
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Optionally handle global 401s here
    return Promise.reject(error);
  }
);
