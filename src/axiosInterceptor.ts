// src/axiosInterceptor.ts
import axios from "axios";

axios.defaults.baseURL = "https://lumaai-backend-672244117841.asia-southeast1.run.app/api";
axios.defaults.timeout = 15000;

// ===== ตัวแปรควบคุม refresh token =====
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token?: string) => void; reject: (err?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token || "");
  });
  failedQueue = [];
};

// ===== Request Interceptor =====
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
  (error) => Promise.reject(error)
);

// ===== Response Interceptor =====
axios.interceptors.response.use(
  (response) => {
    console.log("✅ [Global Response]:", response.config.url);
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ✅ ถ้าเจอ 401 → ลอง refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 🔁 ถ้ามี refresh อยู่แล้ว → รอผล refresh ก่อน
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = "Bearer " + token;
            return axios(originalRequest); // ยิงซ้ำหลัง refresh เสร็จ
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("ไม่มี refresh token");

        console.log("🔄 [Interceptor] Refreshing token...");
        const res = await axios.post("/auth/token", {
          grantType: "refresh_token",
          refreshToken: refreshToken,
        });

        if (res.status === 200 && res.data.access_token) {
          const newToken = res.data.access_token;
          localStorage.setItem("access_token", newToken);
          console.log("✅ [Interceptor] Token refreshed!");
          processQueue(null, newToken);

          // ใส่ token ใหม่แล้วยิงซ้ำ
          originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
          return axios(originalRequest);
        } else {
          throw new Error("Refresh failed");
        }
      } catch (err) {
        console.error("❌ [Interceptor] Refresh token error:", err);
        processQueue(err, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "../pages/user";
      } finally {
        isRefreshing = false;
      }
    }

    // ถ้า refresh แล้วก็ยัง 401 อีก
    if (error.response?.status === 401 && originalRequest._retry) {
      console.warn("🚨 [Interceptor] 401 ซ้ำสองครั้ง — บังคับ login ใหม่");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "../pages/user";
    }

    return Promise.reject(error);
  }
);

export default axios;
