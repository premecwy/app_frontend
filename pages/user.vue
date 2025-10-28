<template>
  <div class="user-page">
    <!-- Header with Back Button -->
    <header class="user-header">
      <button class="back-btn" @click="go">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <!-- <h1 class="page-title">User Profile</h1> -->
    </header>

    <div class="user-content">
      <!-- Logged In State -->
      <div v-if="user" class="profile-container">
        <div class="profile-card">
          <div class="profile-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          
          <h2 class="profile-name">{{ user.name }}</h2>
          
          <div class="profile-info">
            <div class="info-item">
              <span class="info-label">Email</span>
              <span class="info-value">{{ user.email }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">User ID</span>
              <span class="info-value user-id">{{ user.uid }}</span>
            </div>
          </div>
        </div>

        <!-- <div class="token-card">
          <h3 class="token-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Firebase ID Token
          </h3>
          <textarea class="token-textarea" readonly>{{ token }}</textarea>
        </div> -->

        <button class="btn-logout" @click="logout">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Logout
        </button>
      </div>

      <!-- Not Logged In State -->
      <div v-else class="login-container">
        <div class="login-card">
          <div class="login-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          
          <h2 class="login-title">Welcome Back</h2>
          <p class="login-subtitle">Sign in to access your profile</p>
          
          <button class="btn-login" @click="loginGoogle">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../src/firebase";
import { useRouter } from "vue-router";

const router = useRouter();
const user = ref({});
const firebaseToken = ref("");
const accessToken = ref("");
const refreshToken = ref("");


function go() {
  router.push("/");
}

async function loginGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    user.value = {
      uid: result.user.uid,
      name: result.user.displayName,
      email: result.user.email,
    };

    // ✅ ได้ Firebase token
    firebaseToken.value = await result.user.getIdToken(true); // 🔥 บรรทัดนี้เพิ่ม force refresh token
    console.log("✅ Firebase ID Token:", firebaseToken.value)

    // ✅ ส่งไป backend แลก access/refresh token
    const res = await fetch("https://luma-model-local.bkkz.org/api/auth/login-google", {
      method: "POST",
      headers: { "Content-Type": "application/json"},
      body: JSON.stringify({ "idToken": firebaseToken.value }),
    });
    if (!res.ok) throw new Error("Backend login failed");
    const data = await res.json();

    accessToken.value = data.access_token;
    refreshToken.value = data.refresh_token;

    // ✅ เก็บทั้งหมดใน localStorage
    localStorage.setItem("user_profile", JSON.stringify(user.value));
    localStorage.setItem("firebase_token", firebaseToken.value);
    localStorage.setItem("access_token", accessToken.value);
    localStorage.setItem("refresh_token", refreshToken.value);
    
    console.log("✅ Saved tokens to localStorage");
  } catch (err) {
    console.error("❌ Login failed:", err);

    // ✅ เพิ่ม log ลึกขึ้น ถ้ามี response จาก backend
    if (err.response) {
      try {
        const text = await err.response.text();
        console.error("🔍 Backend Response:", text);
      } catch (e) {
        console.error("⚠️ Failed to read backend response:", e);
      }
    }
  }
}

function logout() {
  user.value = null;
  firebaseToken.value = "";
  accessToken.value = "";
  refreshToken.value = "";

  localStorage.removeItem("user_profile");
  localStorage.removeItem("firebase_token");
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

// ✅ โหลด state เก่า
const savedUser = localStorage.getItem("user_profile");
const savedFirebase = localStorage.getItem("firebase_token");
const savedAccess = localStorage.getItem("access_token");
const savedRefresh = localStorage.getItem("refresh_token");

if (savedUser && savedFirebase) {
  user.value = JSON.parse(savedUser);
  firebaseToken.value = savedFirebase;
  accessToken.value = savedAccess || "";
  refreshToken.value = savedRefresh || "";
}
</script>


<style scoped>
:root {
  --ivory: #f8f7f4;
  --textDark: #2c3e36;
  --sageLight: #698474;
  --sageDark: #4a5f52;
  --cardBg: #ffffff;
  --shadow: 0 2px 12px rgba(105, 132, 116, 0.12);
  --shadowHover: 0 8px 24px rgba(105, 132, 116, 0.2);
  --radius: 16px;
}

:global(html, body, #app) {
  background: var(--ivory);
  color: var(--textDark);
}

.user-page {
  min-height: 100vh;
  background: var(--ivory);
  padding-bottom: 40px;
}

/* Header */
.user-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px clamp(16px, 5vw, 40px);
  background: var(--cardBg);
  border-bottom: 1px solid rgba(105, 132, 116, 0.15);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid rgba(105, 132, 116, 0.2);
  background: transparent;
  color: var(--textDark);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.back-btn:hover {
  background: var(--sageLight);
  border-color: var(--sageLight);
  color: white;
  transform: translateX(-2px);
}

.page-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  color: var(--textDark);
  margin: 0;
}

/* Content */
.user-content {
  max-width: 800px;
  margin: 0 auto;
  padding: clamp(24px, 5vw, 40px) clamp(16px, 5vw, 40px);
}

/* Profile Container (Logged In) */
.profile-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  animation: fadeIn 0.5s ease-out;
}

.profile-card {
  background: #c6ab73;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: clamp(24px, 5vw, 40px);
  text-align: center;
  transition: box-shadow 0.3s ease;
}

/* .profile-card:hover {
  box-shadow: var(--shadowHover);
} */

.profile-avatar {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, var(--sageLight) 0%, var(--sageDark) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.profile-name {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  color: white;
  margin: 0 0 24px 0;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: #f8f7f4d1;
  border-radius: 12px;
  transition: background 0.2s ease;
}
/* 
.info-item:hover {
  background: rgba(105, 132, 116, 0.08);
} */

.info-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--sageLight);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: var(--textDark);
  word-break: break-all;
}

.user-id {
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.875rem;
}

/* Token Card */
.token-card {
  background: #c6ab73;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: clamp(20px, 4vw, 32px);
  transition: box-shadow 0.3s ease;
}

.token-card:hover {
  box-shadow: var(--shadowHover);
}

.token-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0 0 16px 0;
}

.token-title svg {
  color: var(--sageLight);
}

.token-textarea {
  width: 100%;
  min-height: 120px;
  padding: 16px;
  border: 1px solid rgba(105, 132, 116, 0.2);
  border-radius: 12px;
  background: #f8f7f4d1;
  color: var(--textDark);
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 0.8rem;
  resize: vertical;
  transition: all 0.2s ease;
}

.token-textarea:focus {
  outline: none;
  border-color: var(--sageLight);
  box-shadow: 0 0 0 3px rgba(105, 132, 116, 0.1);
}

/* Logout Button */
.btn-logout {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px 24px;
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 12px;
  background: transparent;
  color: #dc2626;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-logout:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
}

/* Login Container (Not Logged In) */
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 200px);
  animation: fadeIn 0.5s ease-out;
}

.login-card {
  background: #c6ab73;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: clamp(32px, 6vw, 48px);
  text-align: center;
  max-width: 400px;
  width: 100%;
  transition: box-shadow 0.3s ease;
}

.login-card:hover {
  box-shadow: var(--shadowHover);
}

.login-icon {
  width: 120px;
  height: 120px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, var(--sageLight) 0%, var(--sageDark) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.login-title {
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
}

.login-subtitle {
  font-size: 1rem;
  color: white;
  margin: 0 0 32px 0;
}

/* Login Button */
.btn-login {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 24px;
  border: 1px solid rgba(105, 132, 116, 0.2);
  border-radius: 12px;
  background: white;
  color: var(--textDark);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow);
}

.btn-login:hover {
  background: var(--sageLight);
  border-color: var(--sageLight);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadowHover);
}

.btn-login svg {
  width: 24px;
  height: 24px;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .user-header {
    padding: 16px;
  }
  
  .user-content {
    padding: 20px 16px;
  }
  
  .profile-avatar,
  .login-icon {
    width: 100px;
    height: 100px;
  }
  
  .profile-avatar svg,
  .login-icon svg {
    width: 56px;
    height: 56px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.25rem;
  }
  
  .back-btn {
    width: 36px;
    height: 36px;
  }
  
  .profile-card,
  .token-card,
  .login-card {
    padding: 20px;
  }
}
</style>
