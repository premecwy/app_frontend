import { createApp } from "vue";
import App from "./app.vue";
import router from "./router";
import "./assets/styles.css";
import "./axiosInterceptor";

createApp(App).use(router).mount("#app");
