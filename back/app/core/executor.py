import sqlite3
from typing import List, Dict, Any, Optional

class SQLExecutor:
    @staticmethod
    def execute(sql: str, init_sql: Optional[str] = None) -> Dict[str, Any]:
        """
        Execute SQL in an in-memory SQLite database.
        """
        conn = sqlite3.connect(":memory:")
        cursor = conn.cursor()
        
        try:
            if init_sql:
                cursor.executescript(init_sql)
            
            # Execute user SQL
            cursor.execute(sql)
            
            # Fetch results
            if cursor.description:
                columns = [description[0] for description in cursor.description]
                values = cursor.fetchall()
            else:
                columns = []
                values = []
            
            results = []
            for row in values:
                results.append(dict(zip(columns, row)))
            
            return {
                "columns": columns,
                "values": values, # Keep raw values for comparison
                "data": results # For JSON response
            }
        except Exception as e:
            raise e
        finally:
            conn.close()

    @staticmethod
    def check_result(user_sql: str, answer_sql: str, init_sql: str) -> bool:
        """
        Compare the results of user SQL and answer SQL.
        """
        try:
            user_res = SQLExecutor.execute(user_sql, init_sql)
            answer_res = SQLExecutor.execute(answer_sql, init_sql)
            
            if user_res["columns"] != answer_res["columns"]:
                return False
            
            if user_res["values"] != answer_res["values"]:
                return False
                
            return True
        except Exception:
            return False
