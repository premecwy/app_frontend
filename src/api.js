import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8080", // URL backend
});

// ✅ ดักทุก request → ใส่ access_token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ ดัก response → ถ้าเจอ 401 → ขอ refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          // ขอ access token ใหม่
          const res = await axios.post("http://localhost:8000/auth/refresh", {
            refresh_token: refreshToken,
          });
          const newAccess = res.data.access_token;

          // เก็บใหม่
          localStorage.setItem("access_token", newAccess);

          // ยิง request เดิมอีกครั้ง
          error.config.headers.Authorization = `Bearer ${newAccess}`;
          return api.request(error.config);
        } catch (err) {
          console.error("❌ Refresh token ใช้ไม่ได้", err);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
