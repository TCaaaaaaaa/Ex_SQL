const BASE_URL = 'http://localhost:8000/api';

export const api = {
  async getLevels() {
    const res = await fetch(`${BASE_URL}/levels/`);
    return res.json();
  },

  async getLevel(key: string) {
    const res = await fetch(`${BASE_URL}/levels/${key}`);
    return res.json();
  },

  async executeSql(sql: string, initSql?: string) {
    const res = await fetch(`${BASE_URL}/sql/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql, init_sql: initSql }),
    });
    return res.json();
  },

  async checkSql(userSql: string, answerSql: string, initSql: string) {
    const res = await fetch(`${BASE_URL}/sql/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_sql: userSql, answer_sql: answerSql, init_sql: initSql }),
    });
    return res.json();
  },

  async diagnoseSql(userSql: string, answerSql: string) {
    const res = await fetch(`${BASE_URL}/sql/diagnose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_sql: userSql, answer_sql: answerSql }),
    });
    return res.json();
  },

  // --- 用户相关 API ---

  async getUsers() {
    const res = await fetch(`${BASE_URL}/users/`);
    return res.json();
  },

  async createUser(username: string) {
    const res = await fetch(`${BASE_URL}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
        throw new Error((await res.json()).detail);
    }
    return res.json();
  },

  async getUser(username: string) {
    const res = await fetch(`${BASE_URL}/users/${username}`);
    if (!res.ok) return null;
    return res.json();
  },

  async updateUserKnowledge(username: string, knowledgeMap: any) {
    const res = await fetch(`${BASE_URL}/users/${username}/knowledge`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ knowledge_map: knowledgeMap }),
    });
    return res.json();
  }
};
