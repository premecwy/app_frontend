import { createApp } from 'vue'
import app from './app.vue'
import router from './router'
import './assets/styles.css'
console.log('CLIENT_ID =>', import.meta.env.VITE_GOOGLE_CLIENT_ID)

createApp(app).use(router).mount('#app')