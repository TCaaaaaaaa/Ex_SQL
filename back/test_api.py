import requests

def test_backend():
    base_url = "http://localhost:8000/api"
    
    # 1. Test levels
    print("Testing /levels...")
    res = requests.get(f"{base_url}/levels/")
    levels = res.json()
    print(f"Found {len(levels)} levels")
    
    if len(levels) > 0:
        level = levels[0]
        print(f"Testing /sql/execute for level {level['key']}...")
        exec_res = requests.post(f"{base_url}/sql/execute", json={
            "sql": level["defaultSQL"],
            "init_sql": level["initSQL"]
        })
        print(f"Execution result columns: {exec_res.json()['columns']}")
        
        print(f"Testing /sql/check...")
        check_res = requests.post(f"{base_url}/sql/check", json={
            "user_sql": level["defaultSQL"],
            "answer_sql": level["answer"],
            "init_sql": level["initSQL"]
        })
        print(f"Check result: {check_res.json()['is_correct']}")

        print(f"Testing /sql/diagnose (with LLM)...")
        # 故意构造一个错误的 SQL
        wrong_sql = "SELECT * FROM student" # 假设缺少条件
        diag_res = requests.post(f"{base_url}/sql/diagnose", json={
            "user_sql": wrong_sql,
            "answer_sql": level["answer"]
        })
        print(f"Diagnosis Response: {diag_res.json()}")

if __name__ == "__main__":
    try:
        test_backend()
    except Exception as e:
        print(f"Test failed: {e}")
