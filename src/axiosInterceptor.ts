// src/axiosInterceptor.ts
import axios from "axios";

// ตั้งค่ากลาง
axios.defaults.baseURL = "https://lumaai-backend-672244117841.asia-southeast1.run.app/api";
axios.defaults.timeout = 15000;

// ใช้ flag กันการ refresh ซ้ำซ้อน
let isRetrying = false;

// 🟩 Request Interceptor — ก่อนยิง request
axios.interceptors.request.use(
  (config) => {
    console.log("🚦 ผ่านตัวกลางก่อนยิงจริง:", config.method?.toUpperCase(), config.url);

    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers["X-App-Source"] = "LumaAI-Frontend";
    return config;
  },
  (error) => {
    console.error("❌ [Global Request Error]:", error);
    return Promise.reject(error);
  }
);

// 🟥 Response Interceptor — หลังยิง request
axios.interceptors.response.use(
  (response) => {
    console.log("✅ [Global Response]:", response.config.url);
    return response;
  },
  async (error) => {
    console.error("❌ [Global Response Error]:", error.response?.status, error.message);

    const originalRequest = error.config;

    // ถ้า 401 และยังไม่ได้ retry
    if (error.response?.status === 401 && !isRetrying) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        isRetrying = true;
        console.log("🔄 [Interceptor] Refreshing token...");

        try {
          const res = await axios.post("/auth/token", {
            grantType: "refresh_token",
            refreshToken: refreshToken,
          });

          console.log("🔄 [Interceptor] Refresh response:", res.status, res.data);

          if (res.status === 200 && res.data.access_token) {
            const newToken = res.data.access_token;
            localStorage.setItem("access_token", newToken);
            console.log("✅ [Interceptor] Token refreshed!");

            // ใส่ token ใหม่แล้วยิงซ้ำ
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            isRetrying = false;
            return axios(originalRequest);
          } else {
            throw new Error("Refresh failed");
          }
        } catch (err) {
          console.error("❌ [Interceptor] Refresh token error:", err);
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "../pages/user"; // ไปหน้า login ใหม่
        }
      }
    } 
    // ถ้าเจอ 401 อีกครั้งขณะกำลัง retry → บังคับ logout ทันที
    else if (error.response?.status === 401 && isRetrying) {
      console.warn("🚨 [Interceptor] 401 ซ้ำสองครั้ง — บังคับให้ login ใหม่");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "../pages/user";
    }

    return Promise.reject(error);
  }
);

export default axios;
