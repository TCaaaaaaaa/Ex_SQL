import { RouteRecordRaw } from "vue-router";
import IndexPage from "../pages/IndexPage.vue";
import LevelsPage from "../pages/LevelsPage.vue";
import PlaygroundPage from "../pages/PlaygroundPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import DashboardPage from "../pages/DashboardPage.vue";

/**
 * 路由列表
 */
export default [
  {
    path: "/login",
    component: LoginPage,
  },
  {
    path: "/dashboard",
    component: DashboardPage,
  },
  {
    path: "/",
    component: IndexPage,
    redirect: "/learn",
    props: true,
  },
  {
    path: "/learn/:levelKey?",
    component: IndexPage,
    props: true,
  },
  {
    path: "/levels",
    component: LevelsPage,
  },
  {
    path: "/playground",
    component: PlaygroundPage,
  },
] as RouteRecordRaw[];
