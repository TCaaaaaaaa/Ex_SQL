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
      // 检查是否有持久化的用户
      if (this.currentUser) {
        // 尝试获取用户信息验证有效性 (可选)
        try {
          await api.getUser(this.currentUser);
        } catch (e) {
          // 如果获取失败，可能用户已不存在，登出
          this.logout();
        }
      }
    },

    async login(username: string, password?: string) {
        try {
            await api.login(username, password);
            this.currentUser = username;
            if (!this.users.includes(username)) {
                this.users.push(username);
            }
            // 同步知识状态
            const user = await api.getUser(username);
            if (user && user.knowledge_map) {
                const knowledgeStore = useKnowledgeStore();
                knowledgeStore.syncFromBackend(username, user.knowledge_map);
            }
        } catch (e) {
            console.error("Login failed", e);
            throw e;
        }
    },

    async register(username: string, password?: string) {
        try {
            await api.createUser(username, password);
            // 注册成功后自动登录
            await this.login(username, password);
        } catch (e) {
            console.error("Register failed", e);
            throw e;
        }
    },

    logout() {
        this.currentUser = '';
        // 可以选择是否清空 users 列表，这里保留历史登录过的用户列表供参考，或者也可以清空
        // this.users = []; 
        window.location.reload();
    },

    // Deprecated: use login instead
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
