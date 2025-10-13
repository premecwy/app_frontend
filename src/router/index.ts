import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import("../../pages/home.vue") },
  { path: "/task", component: () => import("../../pages/task.vue") },
  { path: "/llm", component: () => import("../../pages/llm.vue") },
  { path: "/fillform", component: () => import("../../pages/auto_fill.vue") },
  { path: "/fillform/idcard", component: () => import("../../pages/idcard_upload.vue") },
  { path: "/fillform/accident", component: () => import("../../pages/accident_upload.vue") },
  { path: "/user", component: () => import("../../pages/user.vue") },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;