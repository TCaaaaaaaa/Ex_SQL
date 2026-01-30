import { api } from "../api";

/**
 * SQL 执行器 (重构版：调用后端 API)
 */

/**
 * 获取初始化 DB (后端模式下，DB 由后端管理，前端不需要 initDB)
 * 为了兼容性保留接口，但返回空
 * @param initSql
 */
export const initDB = async (initSql?: string) => {
  return initSql; // 仅仅返回 initSql 供后续使用
};

/**
 * 执行 SQL
 * @param initSql
 * @param sql
 */
export const runSQL = async (initSql: string, sql: string) => {
  const res = await api.executeSql(sql, initSql);
  // 转换后端返回格式为 sql.js 的格式以兼容原有组件
  return [
    {
      columns: res.columns,
      values: res.values,
    },
  ];
};
