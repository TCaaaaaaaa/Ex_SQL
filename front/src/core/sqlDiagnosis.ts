import { api } from "../api";

// 定义诊断结果接口
export interface DiagnosisResult {
  type: "MISSING_CONDITION" | "WRONG_OPERATOR" | "MISSING_COLUMN" | "EXTRA_COLUMN" | "WRONG_TABLE" | "MISSING_GROUP_BY" | "EXTRA_GROUP_BY" | "WRONG_CLAUSE" | "OTHER";
  message: string;
  suggestion: string; // 基于可拓变换的建议
}

/**
 * SQL 智能诊断核心逻辑 (重构版：调用后端 API)
 */
export const diagnoseSql = async (userSql: string, stdSql: string): Promise<DiagnosisResult[]> => {
  try {
    return await api.diagnoseSql(userSql, stdSql);
  } catch (e) {
    console.error("SQL Diagnosis Error:", e);
    return [];
  }
};
