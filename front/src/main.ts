import { createApp } from "vue";
import Antd from "ant-design-vue";
import App from "./App.vue";
import * as VueRouter from "vue-router";
import routes from "./configs/routes";
import { createPinia, setActivePinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "ant-design-vue/dist/antd.css";
import "./style.css";
import { useUserStore } from "./core/userStore";

const app = createApp(App);

// 状态管理
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
setActivePinia(pinia); // 显式激活 Pinia

// 路由
const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes,
});

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  if (to.path !== '/login' && !userStore.currentUser) {
    next('/login');
  } else {
    next();
  }
});

app.use(Antd).use(router).mount("#app");
