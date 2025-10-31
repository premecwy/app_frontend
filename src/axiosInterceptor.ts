// src/axiosInterceptor.ts
import axios from "axios";

// ตั้งค่ากลาง
axios.defaults.baseURL = "https://lumaai-backend-672244117841.asia-southeast1.run.app/api";
axios.defaults.timeout = 15000;

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

    // ดัก 401 → refresh token อัตโนมัติ
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        console.log("🔄 [Interceptor] Refreshing token...");
        try {
          const res = await axios.post("/auth/token", { grantType: "refresh_token", refreshToken: refreshToken });
          console.log("🔄 [Interceptor] Refresh response:", res.status, res.data);
          if(res.status === 200){
            const newToken = res.data.access_token;
            localStorage.setItem("access_token", newToken);
            error.config.headers.Authorization = `Bearer ${newToken}`;
            console.log("✅ [Interceptor] Token refreshed!");
          }else{
            console.error("❌ [Interceptor] Refresh failed");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");
            window.location.href = "../pages/user"; // Redirect to login page
          }

          
          return axios(error.config);
        } catch (err) {
          console.error("❌ Kuay Error rai mai roo:", err);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axios;
