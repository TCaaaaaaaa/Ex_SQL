import { Parser } from 'node-sql-parser';

/**
 * 可拓物元模型定义
 * M = (Object, Feature, Value)
 */
export interface SqlMatterElement {
  object: string; // 固定为 "SQL_QUERY"
  
  // ===== 特征元 (Features) =====
  selectColumns: string[];
  fromTables: string[];
  whereConditions: string[]; // 拆解后的 AND 条件列表
  groupByColumns: string[];
  havingConditions: string[]; // 拆解后的 AND 条件列表
  joinInfos: string[];
}

/**
 * SQL -> 可拓物元解析器
 * 负责将 SQL 语句转换为结构化的物元形式
 */
export class SqlMatterElementParser {
  private static parser = new Parser();

  /**
   * 解析 SQL 为可拓物元
   * @param sql 用户输入的 SQL
   */
  static parse(sql: string): SqlMatterElement {
    const element: SqlMatterElement = {
      object: 'SQL_QUERY',
      selectColumns: [],
      fromTables: [],
      whereConditions: [],
      groupByColumns: [],
      havingConditions: [],
      joinInfos: []
    };

    try {
      const ast = this.parser.astify(sql) as any;

      // 目前仅支持 SELECT 语句
      if (!ast || ast.type !== 'select') {
        console.warn('SqlMatterElementParser only supports SELECT statements.');
        return element;
      }

      // 1. SELECT Columns
      if (ast.columns) {
        element.selectColumns = ast.columns.map((col: any) => {
           return this.exprToString(col.expr) + (col.as ? ` AS ${col.as}` : '');
        });
      }

      // 2. FROM Tables & JOINs
      if (ast.from && ast.from.length > 0) {
        // 第一个通常是主表
        const first = ast.from[0];
        element.fromTables.push(this.tableToString(first));

        // 后续的可能是隐式 JOIN 或显式 JOIN
        // node-sql-parser 将 JOIN 也放在 from 数组中
        for (let i = 1; i < ast.from.length; i++) {
          const item = ast.from[i];
          if (item.join) {
             element.joinInfos.push(this.joinToString(item));
          } else {
             // 逗号分隔的隐式 JOIN，视为 FROM 表的一部分
             element.fromTables.push(this.tableToString(item));
          }
        }
      }

      // 3. WHERE Conditions
      if (ast.where) {
        element.whereConditions = this.splitConditions(ast.where);
      }

      // 4. GROUP BY
      if (ast.groupby && ast.groupby.columns) {
        element.groupByColumns = ast.groupby.columns.map((col: any) => this.exprToString(col));
      }

      // 5. HAVING Conditions
      if (ast.having) {
        element.havingConditions = this.splitConditions(ast.having);
      }

    } catch (e) {
      console.error('Failed to parse SQL to Matter Element:', e);
      // 可以在此抛出异常或返回空物元
    }

    return element;
  }

  // --- Helpers ---

  /**
   * 将 AST 表达式节点转为字符串
   */
  private static exprToString(expr: any): string {
    if (!expr) return '';

    switch (expr.type) {
      case 'column_ref':
        return (expr.table ? `${expr.table}.` : '') + expr.column;
      
      case 'aggr_func':
        const args = expr.args ? this.exprToString(expr.args.expr) : '';
        return `${expr.name}(${args})`;
        
      case 'star':
        return '*';
        
      case 'number':
      case 'bool':
        return String(expr.value);
        
      case 'string':
      case 'single_quote_string':
        return `'${expr.value}'`;
        
      case 'binary_expr':
        return `${this.exprToString(expr.left)} ${expr.operator} ${this.exprToString(expr.right)}`;

      case 'function':
         // 处理普通函数，如 IFNULL(a, b)
         // node-sql-parser 函数参数结构可能不同，需根据实际调试调整
         // 简单处理：name(...)
         const funcArgs = expr.args && expr.args.value && Array.isArray(expr.args.value) 
            ? expr.args.value.map((arg: any) => this.exprToString(arg)).join(', ')
            : '';
         return `${expr.name}(${funcArgs})`;

      default:
        // 兜底：尝试简单返回 value 或空
        return expr.value || '';
    }
  }

  private static tableToString(item: any): string {
    return (item.db ? `${item.db}.` : '') + item.table + (item.as ? ` AS ${item.as}` : '');
  }

  private static joinToString(item: any): string {
    const table = this.tableToString(item);
    const on = item.on ? ` ON ${this.exprToString(item.on)}` : '';
    return `${item.join} ${table}${on}`;
  }

  /**
   * 拆解 AND 条件
   */
  private static splitConditions(expr: any): string[] {
    const conditions: string[] = [];

    // 递归遍历二叉树，收集所有 AND 连接的叶子节点
    const traverse = (node: any) => {
      if (!node) return;
      
      if (node.type === 'binary_expr' && node.operator.toUpperCase() === 'AND') {
        traverse(node.left);
        traverse(node.right);
      } else {
        // 非 AND 节点，视为一个独立条件
        conditions.push(this.exprToString(node));
      }
    };

    traverse(expr);
    return conditions;
  }
}
