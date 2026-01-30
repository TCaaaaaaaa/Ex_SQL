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

            # 3. Check Where conditions (simplified)
            user_where = user_expression.find(exp.Where)
            std_where = std_expression.find(exp.Where)
            
            if std_where and not user_where:
                results.append({
                    "type": "MISSING_CONDITION",
                    "message": "缺少筛选条件",
                    "suggestion": "答案要求对数据进行筛选，请检查 WHERE 子句。"
                })

        except Exception as e:
            # If parsing fails, it's probably a syntax error which will be caught by execution
            pass

        return results
