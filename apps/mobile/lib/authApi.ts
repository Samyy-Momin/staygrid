import axios from 'axios';
import { getApiUrl } from "./config";

const API_URL = getApiUrl();

// Create axios instance
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If it's an API error response with a message, we can throw that directly
    const message = error.response?.data?.message || error.message || "An unexpected error occurred";
    
    // Optional: Log out user on 401 Unauthorized globally
    if (error.response?.status === 401) {
      console.log('Unauthorized - could trigger global logout event here');
    }

    return Promise.reject(new Error(message));
  }
);

export const authApi = {
  async signUp(data: any) {
    const res = await api.post("/api/auth/sign-up/email", {
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      age: Number(data.age) || null,
    });
    return res.data;
  },

  async signIn(identifier: string, password: string) {
    const email = identifier.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Please use your email address to sign in");
    }
    const res = await api.post("/api/auth/sign-in/email", { email, password });
    return res.data;
  },

  async requestEmailOtp(email: string, type: 'sign-in' | 'email-verification') {
    const res = await api.post("/api/auth/email-otp/send-verification-otp", { email: email.trim().toLowerCase(), type });
    return res.data;
  },

  async signInEmailOtp(email: string, otp: string) {
    const res = await api.post("/api/auth/sign-in/email-otp", { email: email.trim().toLowerCase(), otp });
    return res.data;
  },

  async verifyEmailOtp(email: string, otp: string) {
    const res = await api.post("/api/auth/email-otp/verify-email", { email: email.trim().toLowerCase(), otp });
    return res.data;
  },

  async getSession() {
    try {
      const res = await api.get("/api/auth/get-session");
      return res.data;
    } catch (e) {
      return null;
    }
  },

  async completeProfile(data: { userId?: string; email?: string; phone: string; name?: string; age?: number; gender?: string }) {
    const res = await api.post("/api/auth/complete-profile", data);
    return res.data;
  },

  async signOut() {
    const res = await api.post("/api/auth/sign-out");
    return res.data;
  }
};
