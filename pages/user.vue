<template>
  <div class="user-page">
    <h1>User Profile</h1>

    <!-- ถ้า login แล้ว -->
    <div v-if="user">
      <p><strong>UID:</strong> {{ user.uid }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>

      <p><strong>Firebase ID Token:</strong></p>
      <textarea readonly>{{ token }}</textarea>

      <button class="btn" @click="logout">Logout</button>
    </div>

    <!-- ถ้ายังไม่ได้ login -->
    <div v-else>
      <p>ยังไม่ได้เข้าสู่ระบบ</p>
      <button class="btn primary" @click="loginGoogle">Login with Google</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../src/firebase";

const user = ref(null);
const token = ref("");

async function loginGoogle() {
  try {
    const result = await signInWithPopup(auth, provider);

    user.value = {
      uid: result.user.uid,
      name: result.user.displayName,
      email: result.user.email,
    };

    token.value = await result.user.getIdToken();
    console.log("✅ Firebase ID Token:", token.value);

    // เก็บ localStorage
    localStorage.setItem("user_profile", JSON.stringify(user.value));
    localStorage.setItem("auth_token", token.value);
  } catch (err) {
    console.error("❌ Login failed:", err);
  }
}

function logout() {
  user.value = null;
  token.value = "";
  localStorage.removeItem("user_profile");
  localStorage.removeItem("auth_token");
}

// โหลด state เก่า (ถ้ามี)
const savedUser = localStorage.getItem("user_profile");
const savedToken = localStorage.getItem("auth_token");
if (savedUser && savedToken) {
  user.value = JSON.parse(savedUser);
  token.value = savedToken;
}
</script>

<style scoped>
.user-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 2rem;
}
.btn {
  padding: 0.6rem 1.2rem;
  border-radius: 10px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
}
.btn.primary {
  background: #e0a773;
  color: #fff;
  border-color: #e0a773;
}
textarea {
  width: 100%;
  min-height: 100px;
  font-size: 0.9rem;
}
</style>
