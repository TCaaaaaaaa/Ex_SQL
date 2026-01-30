import { defineStore } from "pinia";
import { api } from "../api";

/**
 * 全局状态存储
 *
 * @author yupi
 */
export const useGlobalStore = defineStore("global", {
  state: () => ({
    // 学习记录
    studyHistoryList: [],
    // 当前关卡
    currentLevel: {} as any,
    // 所有关卡
    allLevels: [] as any[],
  }),
  getters: {},
  // 持久化
  persist: {
    key: "global",
    storage: window.localStorage,
    paths: ['studyHistoryList'], // 只持久化学习记录
  },
  actions: {
    async init() {
      if (this.allLevels.length === 0) {
        const levels = await api.getLevels();
        this.allLevels = levels;
        if (!this.currentLevel.key && levels.length > 0) {
          this.currentLevel = levels[0];
        }
      }
    },
    setCurrentLevel(level: any) {
      this.currentLevel = level;
    },
    reset() {
      this.$reset();
    },
  },
});
