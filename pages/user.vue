<template>
  <div class="user-page">
    <h1>User Profile</h1>

    <div v-if="user">
      <p><strong>UID:</strong> {{ user.uid }}</p>
      <p><strong>Name:</strong> {{ user.name }}</p>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p class="hint">(Token ถูกเก็บใน localStorage)</p>
      <button class="btn" @click="logout">Logout</button>
    </div>

    <div v-else>
      <p>ยังไม่ได้เข้าสู่ระบบ</p>
      <button class="btn primary" @click="login">Login with Google</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

type User = { uid: string; name: string; email: string }
const user = ref<User | null>(null)
const authToken = ref<string | null>(null)
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

let codeClient: any = null

// โหลด script Google Identity ถ้ายังไม่มี
function loadGsiIfNeeded(): Promise<boolean> {
  return new Promise(resolve => {
    // มีแล้วก็จบ
    // @ts-ignore
    if (window.google?.accounts?.oauth2) return resolve(true)

    // ถ้ายังไม่มี <script> ให้สร้าง
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = () => resolve(true)
      s.onerror = () => resolve(false)
      document.head.appendChild(s)
    }

    // ถ้ามีแล้วก็รอโหลดเสร็จ
    let tries = 0
    const interval = setInterval(() => {
      tries++
      // @ts-ignore
      if (window.google?.accounts?.oauth2) {
        clearInterval(interval)
        resolve(true)
      }
      if (tries > 50) {
        clearInterval(interval)
        resolve(false)
      }
    }, 100)
  })
}

async function initCodeClient() {
  if (!clientId) {
    alert('ไม่พบ VITE_GOOGLE_CLIENT_ID ใน .env (ต้อง restart dev server)')
    return false
  }
  if (codeClient) return true

  const ok = await loadGsiIfNeeded()
  if (!ok) {
    alert('โหลด Google script ไม่สำเร็จ')
    return false
  }

  // @ts-ignore
  codeClient = window.google.accounts.oauth2.initCodeClient({
    client_id: clientId,
    scope: 'openid email profile',
    ux_mode: 'popup',
    callback: onCode,
  })
  return true
}

async function login() {
  const ready = await initCodeClient()
  if (!ready) return
  codeClient.requestCode()
}

async function onCode(resp: { code?: string; error?: string }) {
  if (!resp || resp.error || !resp.code) {
    console.error('OAuth error:', resp)
    alert('Login failed: ' + (resp?.error || 'no code'))
    return
  }
  try {
    const r = await fetch('/api/auth/google/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: resp.code }),
    })
    if (!r.ok) throw new Error('Exchange failed')
    const data = await r.json()
    user.value = data.user
    authToken.value = data.token

    // เก็บไว้ localStorage
    localStorage.setItem('user_profile', JSON.stringify(data.user))
    localStorage.setItem('auth_token', data.token)
  } catch (e) {
    console.error(e)
    alert('แลก code ไม่สำเร็จ (backend)')
  }
}

function logout() {
  user.value = null
  authToken.value = null
  localStorage.removeItem('user_profile')
  localStorage.removeItem('auth_token')
}

onMounted(() => {
  // restore state
  const savedUser = localStorage.getItem('user_profile')
  const savedToken = localStorage.getItem('auth_token')
  if (savedUser && savedToken) {
    user.value = JSON.parse(savedUser)
    authToken.value = savedToken
  }
})
</script>

<style scoped>
.user-page {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  padding: 2rem;
}
.btn {
  padding: .6rem 1.2rem;
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
.hint {
  font-size: 12px;
  color: #666;
}
</style>
