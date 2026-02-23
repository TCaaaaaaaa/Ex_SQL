import os
import json
import re

def migrate_levels(base_path):
    levels = []
    
    # Process main levels
    main_path = os.path.join(base_path, "main")
    if os.path.exists(main_path):
        for level_dir in os.listdir(main_path):
            dir_path = os.path.join(main_path, level_dir)
            if os.path.isdir(dir_path):
                level_data = process_level_dir(dir_path, "main")
                if level_data:
                    levels.append(level_data)
                    
    # Process custom levels
    custom_path = os.path.join(base_path, "custom")
    if os.path.exists(custom_path):
        for root, dirs, files in os.walk(custom_path):
            if "index.ts" in files:
                level_data = process_level_dir(root, "custom")
                if level_data:
                    levels.append(level_data)
                    
    return levels

def process_level_dir(dir_path, level_type):
    index_path = os.path.join(dir_path, "index.ts")
    sql_path = os.path.join(dir_path, "createTable.sql")
    readme_path = os.path.join(dir_path, "README.md")
    
    if not os.path.exists(index_path):
        return None
        
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    data = {
        "key": re.search(r'key:\s*["\'](.*?)["\']', content).group(1) if re.search(r'key:\s*["\'](.*?)["\']', content) else os.path.basename(dir_path),
        "title": re.search(r'title:\s*["\'](.*?)["\']', content).group(1) if re.search(r'title:\s*["\'](.*?)["\']', content) else "",
        "type": level_type,
        "defaultSQL": re.search(r'defaultSQL:\s*["\'](.*?)["\']', content).group(1) if re.search(r'defaultSQL:\s*["\'](.*?)["\']', content) else "",
        "answer": re.search(r'answer:\s*["\'](.*?)["\']', content).group(1) if re.search(r'answer:\s*["\'](.*?)["\']', content) else "",
        "hint": re.search(r'hint:\s*["\'](.*?)["\']', content).group(1) if re.search(r'hint:\s*["\'](.*?)["\']', content) else "",
    }
    
    if os.path.exists(sql_path):
        with open(sql_path, "r", encoding="utf-8") as f:
            data["initSQL"] = f.read()
    else:
        data["initSQL"] = ""
        
    if os.path.exists(readme_path):
        with open(readme_path, "r", encoding="utf-8") as f:
            data["content"] = f.read()
    else:
        data["content"] = ""
        
    return data

if __name__ == "__main__":
    front_levels_path = r"D:\Coding\论文代码\Ex_SQL\front\src\levels"
    output_path = r"D:\Coding\论文代码\Ex_SQL\back\app\data\levels.json"
    
    levels = migrate_levels(front_levels_path)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(levels, f, ensure_ascii=False, indent=2)
    
    print(f"Migrated {len(levels)} levels to {output_path}")
