import os
import json
import re

def migrate_levels(base_path):
    levels = []
    
    main_path = os.path.join(base_path, "main")
    if os.path.exists(main_path):
        for level_dir in sorted(os.listdir(main_path), key=lambda x: int(x.replace('level', '')) if x.replace('level', '').isdigit() else 0):
            dir_path = os.path.join(main_path, level_dir)
            if os.path.isdir(dir_path):
                level_data = process_level_dir(dir_path, "main")
                if level_data:
                    levels.append(level_data)
                    
    custom_path = os.path.join(base_path, "custom")
    if os.path.exists(custom_path):
        for root, dirs, files in os.walk(custom_path):
            if "index.ts" in files:
                level_data = process_level_dir(root, "custom")
                if level_data:
                    levels.append(level_data)
                    
    return levels

def extract_string_field(content, field_name):
    pattern = rf'{field_name}:\s*"[^"]*",'
    match = re.search(pattern, content, re.DOTALL)
    if match and '\n' not in match.group(0).split(':')[1].split('"')[1]:
        result = re.search(rf'{field_name}:\s*"(.*?)(?<!\\)",', content, re.DOTALL)
        if result:
            return result.group(1).replace('\\"', '"')
    
    pattern = rf"{field_name}:\s*'[^']*',"
    match = re.search(pattern, content, re.DOTALL)
    if match and '\n' not in match.group(0).split(':')[1].split("'")[1]:
        result = re.search(rf"{field_name}:\s*'(.*?)(?<!\\)',", content, re.DOTALL)
        if result:
            return result.group(1).replace("\\'", "'")
    
    pattern = rf'{field_name}:\s*\n((?:\s*"[^"]*"\s*\+\s*\n)+\s*"[^"]*"\s*,?\n)'
    match = re.search(pattern, content)
    if match:
        lines_content = match.group(1)
        strings = re.findall(r'"([^"]*)"', lines_content)
        result = ''.join(strings)
        result = result.replace('\\n', '\n')
        return result
    
    pattern = rf"{field_name}:\s*\n((?:\s*'[^']*'\s*\+\s*\n)+\s*'[^']*'\s*,?\n)"
    match = re.search(pattern, content)
    if match:
        lines_content = match.group(1)
        strings = re.findall(r"'([^']*)'", lines_content)
        result = ''.join(strings)
        result = result.replace('\\n', '\n')
        return result
    
    return ""

def process_level_dir(dir_path, level_type):
    index_path = os.path.join(dir_path, "index.ts")
    sql_path = os.path.join(dir_path, "createTable.sql")
    readme_path = os.path.join(dir_path, "README.md")
    
    if not os.path.exists(index_path):
        return None
        
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    data = {
        "key": extract_string_field(content, "key"),
        "title": extract_string_field(content, "title"),
        "type": level_type,
        "defaultSQL": extract_string_field(content, "defaultSQL"),
        "answer": extract_string_field(content, "answer"),
        "hint": extract_string_field(content, "hint"),
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
    front_levels_path = os.path.join(os.path.dirname(__file__), "..", "front", "src", "levels")
    output_path = os.path.join(os.path.dirname(__file__), "app", "data", "levels.json")
    
    levels = migrate_levels(front_levels_path)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(levels, f, ensure_ascii=False, indent=2)
    
    print(f"Migrated {len(levels)} levels to {output_path}")
