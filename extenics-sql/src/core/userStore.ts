import { defineStore } from 'pinia';

interface UserState {
  currentUser: string;
  users: string[];
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: 'default_user',
    users: ['default_user'],
  }),
  
  persist: {
    key: "user-store",
    storage: window.localStorage,
  },

  actions: {
    setCurrentUser(username: string) {
      if (!this.users.includes(username)) {
        this.users.push(username);
      }
      this.currentUser = username;
    },
    
    addUser(username: string) {
        if (!this.users.includes(username)) {
            this.users.push(username);
            this.currentUser = username;
        }
    }
  }
});
