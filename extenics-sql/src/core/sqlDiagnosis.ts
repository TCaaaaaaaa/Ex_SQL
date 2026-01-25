import { Parser } from "node-sql-parser";
import { SqlMatterElement, SqlMatterElementParser } from "./sqlMatterElement";

// 定义诊断结果接口
export interface DiagnosisResult {
  type: "MISSING_CONDITION" | "WRONG_OPERATOR" | "MISSING_COLUMN" | "EXTRA_COLUMN" | "WRONG_TABLE" | "MISSING_GROUP_BY" | "EXTRA_GROUP_BY" | "WRONG_CLAUSE" | "OTHER";
  message: string;
  suggestion: string; // 基于可拓变换的建议
}

/**
 * SQL 智能诊断核心逻辑
 * 基于可拓学（Extension Theory）的物元变换原理
 * 
 * 重构版：基于 Step 1 的 SqlMatterElement 进行诊断
 */
export const diagnoseSql = (userSql: string, stdSql: string): DiagnosisResult[] => {
  const results: DiagnosisResult[] = [];

  try {
    // Step 1: 形式化建模 (SQL -> SqlMatterElement)
    // 这是整个系统的地基
    const userElement = SqlMatterElementParser.parse(userSql);
    const stdElement = SqlMatterElementParser.parse(stdSql);

    // Step 2 & 3: 建立不相容方程 & 应用可拓变换

    // --- 特征一：投影列 (Projection) ---
    // 1. 检查缺失 (增变换 T_add)
    stdElement.selectColumns.forEach(col => {
      // 简单的大小写不敏感比较，或者严格比较
      // 这里为了体验更好，使用不区分空格和大小写的比较? 
      // 用户提供的 parse 生成的 string 格式是固定的，所以可以直接比较 string
      if (!userElement.selectColumns.includes(col)) {
        // 尝试模糊匹配 (比如 count(*) 和 COUNT(*))
        const match = userElement.selectColumns.find(u => u.toLowerCase() === col.toLowerCase());
        if (!match) {
          results.push({
            type: "MISSING_COLUMN",
            message: `缺少查询列：${col}`,
            suggestion: `你的查询结果缺少了 [${col}]，建议对 SELECT 子句进行 **增变换**，添加该字段。`
          });
        }
      }
    });

    // 2. 检查多余 (删变换 T_del)
    userElement.selectColumns.forEach(col => {
      const match = stdElement.selectColumns.find(s => s.toLowerCase() === col.toLowerCase());
      if (!match && col !== '*') {
         results.push({
          type: "EXTRA_COLUMN",
          message: `多余查询列：${col}`,
          suggestion: `你获取了额外的数据 [${col}]，请对 SELECT 子句进行 **删变换** 以精简结果。`
        });
      }
    });

    // --- 特征二：数据源 (From) ---
    stdElement.fromTables.forEach(table => {
        if(!userElement.fromTables.includes(table)) {
             results.push({
                type: "WRONG_TABLE",
                message: `缺少数据源：${table}`,
                suggestion: `答案需要从 [${table}] 表获取数据，请检查 FROM 子句。`
            });
        }
    });

    // --- 特征三：过滤与聚合 (Where & Having) ---
    
    // 检查 Where
    checkConditions(userElement.whereConditions, stdElement.whereConditions, 'WHERE', results, userElement.havingConditions);
    
    // 检查 Having
    checkConditions(userElement.havingConditions, stdElement.havingConditions, 'HAVING', results, userElement.whereConditions);


    // --- 特征四：分组 (Group By) ---
    stdElement.groupByColumns.forEach(col => {
        if (!userElement.groupByColumns.includes(col)) {
             results.push({
                type: "MISSING_GROUP_BY",
                message: `缺少分组字段：${col}`,
                suggestion: `答案要求按 [${col}] 进行分组，请在 GROUP BY 子句中 **增加** 该字段。`
            });
        }
    });
    
    // --- 特征五：连接 (Join) ---
    stdElement.joinInfos.forEach(join => {
        // 简化比较，因为 join string 可能很长
        // 也可以进一步拆解 joinInfo
        if (!userElement.joinInfos.includes(join)) {
            // 尝试模糊匹配
             results.push({
                type: "OTHER", // 或者定义 MISSING_JOIN
                message: `缺少连接或连接条件错误`,
                suggestion: `缺少必要的连接操作 [${join}]，请检查 JOIN/ON 子句。`
            });
        }
    });


  } catch (e) {
    console.error("SQL Diagnosis Error:", e);
  }

  return results;
};

// --- Helpers ---

/**
 * 检查条件列表
 * @param userConds 用户条件列表
 * @param stdConds 标准条件列表
 * @param clauseType 当前检查的子句类型
 * @param results 结果数组
 * @param otherClauseUserConds 用户的另一个子句的条件（用于检测 WRONG_CLAUSE）
 */
function checkConditions(
    userConds: string[], 
    stdConds: string[], 
    clauseType: 'WHERE' | 'HAVING', 
    results: DiagnosisResult[],
    otherClauseUserConds: string[]
) {
    stdConds.forEach(stdCond => {
        // 1. 精确匹配
        if (userConds.includes(stdCond)) return;

        // 2. 检查是否写错了位置 (WRONG_CLAUSE)
        if (otherClauseUserConds.includes(stdCond)) {
             results.push({
                type: "WRONG_CLAUSE",
                message: `子句使用错误：${stdCond}`,
                suggestion: `检测到你对 [${stdCond}] 的筛选放在了错误的子句中。建议将其 **置换** 到 ${clauseType} 子句中。`
            });
            return;
        }

        // 3. 检查是否是逻辑错误 (WRONG_OPERATOR)
        // 尝试提取列名进行模糊匹配
        // 假设格式为 "column op value" 或 "func(column) op value"
        // 简单的提取策略：取第一个空格前的部分，或者非符号部分
        const stdColumn = extractColumnFromCondition(stdCond);
        const match = userConds.find(u => extractColumnFromCondition(u) === stdColumn);

        if (match) {
             results.push({
                type: "WRONG_OPERATOR",
                message: `条件逻辑错误：${stdColumn}`,
                suggestion: `对 [${stdColumn}] 的限制有误。建议将 [${match}] **置换** 为 [${stdCond}] 以满足要求。`
            });
        } else {
            // 4. 确实缺失
            results.push({
                type: "MISSING_CONDITION",
                message: `缺少筛选条件：${stdCond}`,
                suggestion: `缺少对 [${stdCond}] 的限制，尝试在 ${clauseType} 子句中 **增加** 条件。`
            });
        }
    });
}

/**
 * 从条件字符串中尝试提取列名/主体
 * 策略：取操作符左边的部分
 */
function extractColumnFromCondition(cond: string): string {
    // 常见的操作符
    const operators = ['=', '>', '<', '>=', '<=', '!=', '<>', ' LIKE ', ' IN ', ' IS '];
    
    let minIndex = cond.length;
    
    operators.forEach(op => {
        const idx = cond.toUpperCase().indexOf(op);
        if (idx !== -1 && idx < minIndex) {
            minIndex = idx;
        }
    });
    
    if (minIndex < cond.length) {
        return cond.substring(0, minIndex).trim();
    }
    
    return cond; // 无法识别操作符，返回原字符串
}
