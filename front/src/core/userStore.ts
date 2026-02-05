import { defineStore } from 'pinia';
import { api } from '../api';
import { useKnowledgeStore } from './knowledgeStore';

interface UserState {
  currentUser: string;
  users: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: '',
    users: [],
  }),
  
  persist: {
    key: "user-store",
    storage: window.localStorage,
  },

  actions: {
    async init() {
      // 从后端获取所有用户列表
      try {
        const users = await api.getUsers();
        this.users = users.map((u: any) => u.username);
        
        // 如果当前没有选中用户且列表不为空，默认选中第一个
        if (!this.currentUser && this.users.length > 0) {
           this.setCurrentUser(this.users[0]);
        }
      } catch (e) {
        console.error("Failed to fetch users", e);
      }
    },

    async setCurrentUser(username: string) {
      if (!username) return;
      
      this.currentUser = username;
      if (!this.users.includes(username)) {
        this.users.push(username);
      }
      
      // 切换用户时，从后端同步该用户的知识状态到本地 knowledgeStore
      try {
        const user = await api.getUser(username);
        if (user && user.knowledge_map) {
           const knowledgeStore = useKnowledgeStore();
           knowledgeStore.syncFromBackend(username, user.knowledge_map);
        }
      } catch (e) {
        console.error("Failed to sync user knowledge", e);
      }
    },
    
    async addUser(username: string) {
        if (!this.users.includes(username)) {
            try {
                await api.createUser(username);
                this.users.push(username);
                // 自动切换
                await this.setCurrentUser(username);
            } catch (e: any) {
                console.error("Failed to create user", e);
                throw e; // 抛出错误供 UI 处理
            }
        }
    }
  }
});
