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
  }
};
