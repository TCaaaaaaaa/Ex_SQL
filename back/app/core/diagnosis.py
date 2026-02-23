import sqlglot
from sqlglot import exp, parse_one
from typing import List, Dict, Any

class SQLDiagnosis:
    @staticmethod
    def diagnose(user_sql: str, std_sql: str) -> List[Dict[str, str]]:
        results = []
        try:
            user_expression = parse_one(user_sql)
            std_expression = parse_one(std_sql)

            # 1. Check Projection (Select columns)
            user_selects = [s.alias_or_name.lower() for s in user_expression.find_all(exp.Alias)] + \
                           [s.name.lower() for s in user_expression.find_all(exp.Column)]
            std_selects = [s.alias_or_name.lower() for s in std_expression.find_all(exp.Alias)] + \
                          [s.name.lower() for s in std_expression.find_all(exp.Column)]
            
            # Simplified check for select columns
            for col in std_selects:
                if col not in user_selects:
                    results.append({
                        "type": "MISSING_COLUMN",
                        "message": f"缺少查询列：{col}",
                        "suggestion": f"你的查询结果缺少了 [{col}]，建议对 SELECT 子句进行增加变换，添加该字段。"
                    })

            # 2. Check Data Source (From tables)
            user_tables = [t.name.lower() for t in user_expression.find_all(exp.Table)]
            std_tables = [t.name.lower() for t in std_expression.find_all(exp.Table)]
            
            for table in std_tables:
                if table not in user_tables:
                    results.append({
                        "type": "WRONG_TABLE",
                        "message": f"缺少数据源：{table}",
                        "suggestion": f"答案需要从 [{table}] 表获取数据，请检查 FROM 子句。"
                    })

            # 3. Check Where conditions
            user_where = user_expression.find(exp.Where)
            std_where = std_expression.find(exp.Where)
            
            if std_where and not user_where:
                results.append({
                    "type": "MISSING_CONDITION",
                    "message": "缺少筛选条件",
                    "suggestion": "答案要求对数据进行筛选，请检查 WHERE 子句。"
                })
            elif std_where and user_where:
                SQLDiagnosis._check_where_clause(user_where, std_where, results)

            # 4. Check DISTINCT
            # distinct is usually part of Select expression in sqlglot
            if std_expression.find(exp.Distinct) and not user_expression.find(exp.Distinct):
                 results.append({
                    "type": "MISSING_KEYWORD",
                    "message": "缺少去重关键字",
                    "suggestion": "答案要求对结果进行去重，请检查 SELECT DISTINCT 子句。"
                })

            # 5. Check GROUP BY
            std_group = std_expression.find(exp.Group)
            user_group = user_expression.find(exp.Group)
            if std_group and not user_group:
                 results.append({
                    "type": "MISSING_CLAUSE",
                    "message": "缺少分组子句",
                    "suggestion": "答案要求对数据进行分组，请检查 GROUP BY 子句。"
                })
            elif std_group and user_group:
                # 简单检查分组列
                std_g_cols = set([c.name.lower() for c in std_group.find_all(exp.Column)])
                user_g_cols = set([c.name.lower() for c in user_group.find_all(exp.Column)])
                if std_g_cols != user_g_cols:
                     results.append({
                        "type": "WRONG_GROUP_BY",
                        "message": "分组列不匹配",
                        "suggestion": f"请检查 GROUP BY 的字段。标准答案涉及: {', '.join(std_g_cols)}"
                    })

            # 6. Check ORDER BY
            std_order = std_expression.find(exp.Order)
            user_order = user_expression.find(exp.Order)
            if std_order and not user_order:
                 results.append({
                    "type": "MISSING_CLAUSE",
                    "message": "缺少排序子句",
                    "suggestion": "答案要求对数据进行排序，请检查 ORDER BY 子句。"
                })

            # 7. Check HAVING
            std_having = std_expression.find(exp.Having)
            user_having = user_expression.find(exp.Having)
            if std_having and not user_having:
                 results.append({
                    "type": "MISSING_CLAUSE",
                    "message": "缺少 HAVING 子句",
                    "suggestion": "答案要求对分组后的数据进行筛选，请检查 HAVING 子句。"
                })
            elif std_having and user_having:
                 # 复用 WHERE 的检查逻辑，因为结构类似
                 SQLDiagnosis._check_where_clause(user_having, std_having, results, clause_name="HAVING")

            # 8. Check JOINs
            SQLDiagnosis._check_joins(user_expression, std_expression, results)

        except Exception as e:
            # If parsing fails, it's probably a syntax error which will be caught by execution
            pass

        return results

    @staticmethod
    def _extract_column_name(node):
        """Helper to extract column name from a node, handling Alias and Column"""
        if isinstance(node, exp.Alias):
            return node.alias_or_name.lower()
        elif isinstance(node, exp.Column):
            return node.name.lower()
        # Handle simple aggregation functions as "columns" for diagnosis purpose
        elif isinstance(node, exp.Count):
            return "count"
        elif isinstance(node, exp.Avg):
            return "avg"
        elif isinstance(node, exp.Sum):
            return "sum"
        elif isinstance(node, exp.Max):
            return "max"
        elif isinstance(node, exp.Min):
            return "min"
        return str(node).lower()

    @staticmethod
    def _check_joins(user_expression, std_expression, results):
        user_joins = list(user_expression.find_all(exp.Join))
        std_joins = list(std_expression.find_all(exp.Join))
        
        if not std_joins:
            return

        if not user_joins:
             results.append({
                "type": "MISSING_JOIN",
                "message": "缺少 JOIN 操作",
                "suggestion": "答案涉及多表连接，请使用 JOIN。"
            })
             return

        # 简单比对 JOIN 的数量和表名
        # 更复杂的比对（如 ON 条件）暂不深入，避免误报
        user_join_tables = [j.this.alias_or_name.lower() for j in user_joins]
        std_join_tables = [j.this.alias_or_name.lower() for j in std_joins]
        
        for table in std_join_tables:
            if table not in user_join_tables:
                 results.append({
                    "type": "WRONG_JOIN_TABLE",
                    "message": f"缺少连接表：{table}",
                    "suggestion": f"请检查 JOIN 的目标表，确保连接了 {table}。"
                })
        
        # Check Join Types (Left, Right, Inner)
        # Note: sqlglot represents join type in 'kind' or 'side' properties
        # e.g., LEFT JOIN -> side='LEFT', kind='OUTER' (or just side='LEFT')
        for i, std_join in enumerate(std_joins):
            if i < len(user_joins):
                user_join = user_joins[i]
                # Compare side (LEFT/RIGHT/FULL) and kind (OUTER/INNER/CROSS)
                # Normalize to avoid None mismatch
                std_side = (std_join.args.get('side') or "").upper()
                user_side = (user_join.args.get('side') or "").upper()
                std_kind = (std_join.args.get('kind') or "").upper()
                user_kind = (user_join.args.get('kind') or "").upper()
                
                # Special handling: 'JOIN' default is usually INNER
                if not std_side and not std_kind: std_kind = "INNER"
                if not user_side and not user_kind: user_kind = "INNER"
                
                if std_side != user_side or std_kind != user_kind:
                     results.append({
                        "type": "WRONG_JOIN_TYPE",
                        "message": f"连接类型可能不匹配 (第 {i+1} 个 JOIN)",
                        "suggestion": f"标准答案使用了 {std_side} {std_kind} JOIN，请检查连接类型（如 INNER, LEFT, RIGHT）。"
                    })


    @staticmethod
    def _check_where_clause(user_where, std_where, results, clause_name="WHERE"):
        # 1. 检查列名引用
        user_cols = set()
        for c in user_where.find_all(exp.Column, exp.Count, exp.Avg, exp.Sum, exp.Max, exp.Min):
             # Skip if it's inside another aggregation (simplified)
             if isinstance(c, exp.Column) and isinstance(c.parent, (exp.Count, exp.Avg, exp.Sum, exp.Max, exp.Min)):
                 continue
             user_cols.add(SQLDiagnosis._extract_column_name(c))
             
        std_cols = set()
        for c in std_where.find_all(exp.Column, exp.Count, exp.Avg, exp.Sum, exp.Max, exp.Min):
             if isinstance(c, exp.Column) and isinstance(c.parent, (exp.Count, exp.Avg, exp.Sum, exp.Max, exp.Min)):
                 continue
             std_cols.add(SQLDiagnosis._extract_column_name(c))
        
        missing_cols = std_cols - user_cols
        if missing_cols:
            for col in missing_cols:
                results.append({
                    "type": f"MISSING_{clause_name}_COLUMN",
                    "message": f"{clause_name} 条件中缺少对 [{col}] 的判断",
                    "suggestion": f"请检查 {clause_name} 子句，确保包含对 {col} 的筛选。"
                })
        
        # 2. 检查操作符和值
        user_ops = SQLDiagnosis._extract_operators(user_where)
        std_ops = SQLDiagnosis._extract_operators(std_where)
        
        for std_op in std_ops:
            # 寻找针对同一列的操作
            matching_user_ops = [op for op in user_ops if op['column'] == std_op['column']]
            
            if not matching_user_ops:
                continue
                
            op_match = False
            value_match = False
            
            for user_op in matching_user_ops:
                if user_op['type'] == std_op['type']:
                    op_match = True
                    # Convert values to string for comparison to handle slight type diffs
                    if str(user_op['value']) == str(std_op['value']):
                        value_match = True
            
            if not op_match:
                user_op_type = matching_user_ops[0]['type']
                results.append({
                    "type": "WRONG_OPERATOR",
                    "message": f"对列 [{std_op['column']}] 的筛选逻辑可能有误",
                    "suggestion": f"标准答案使用了 {std_op['type']} 逻辑，而你使用了 {user_op_type}。请检查比较操作符。"
                })
            elif not value_match:
                  results.append({
                    "type": "WRONG_VALUE",
                    "message": f"对列 [{std_op['column']}] 的筛选值可能有误",
                    "suggestion": f"请检查筛选的值。标准答案为 '{std_op['value']}'。"
                })

    @staticmethod
    def _extract_operators(where_expression):
        ops = []
        # 遍历常见的二元操作符
        target_types = (exp.EQ, exp.GT, exp.LT, exp.GTE, exp.LTE, exp.Like, exp.ILike)
        
        for node in where_expression.find_all(target_types):
            op_type = node.key.upper()
            
            # Check for NOT (parent is Not)
            if isinstance(node.parent, exp.Not):
                op_type = f"NOT_{op_type}"
            
            col = None
            val = None
            
            left = node.this
            right = node.expression
            
            # Try to identify which side is the column/expression and which is the literal
            # This is a heuristic: literals are usually values
            target_expr = None
            if isinstance(right, exp.Literal):
                val = right.this
                target_expr = left
            elif isinstance(left, exp.Literal):
                val = left.this
                target_expr = right
            else:
                # If neither is a literal, assume left is column for now (e.g. col1 = col2)
                target_expr = left
                val = str(right)

            # Use helper to extract column/agg name
            col = SQLDiagnosis._extract_column_name(target_expr)
            if not col:
                col = str(target_expr).lower()

            if col:
                ops.append({
                    "type": op_type,
                    "column": col,
                    "value": val
                })
                
        return ops
