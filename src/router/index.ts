import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/',         component: () => import('../../pages/home.vue') },
  { path: '/task',     component: () => import('../../pages/task.vue') },
  { path: '/llm',      component: () => import('../../pages/llm.vue') },
  { path: '/fillform', component: () => import('../../pages/auto_fill.vue') },
  { path: '/user',     component: () => import('../../pages/user.vue') },
]

const router = createRouter({ history: createWebHistory(), routes })

// ถ้าหน้าไหนอนาคตอยากล็อกอินก่อน ให้ใส่ meta.requiresAuth = true
router.beforeEach((to, _from, next) => {
  if (to.meta?.requiresAuth) {
    const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token')
    if (!token) return next('/user')
  }
  next()
})

export default router
