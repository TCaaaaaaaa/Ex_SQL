from fastapi import APIRouter, HTTPException
import os
import json
from typing import List, Dict, Any

router = APIRouter()

# Simple level data loader
def load_levels():
    levels = []
    # In a real app, this would be in a database
    # For now, we can read from the front/src/levels/main and front/src/levels/custom
    # or migrate them to back/app/data
    
    # Let's assume we've migrated them to back/app/data/levels.json for simplicity
    levels_path = os.path.join(os.path.dirname(__file__), "..", "data", "levels.json")
    if os.path.exists(levels_path):
        with open(levels_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@router.get("/")
async def get_levels():
    return load_levels()

@router.get("/{level_key}")
async def get_level(level_key: str):
    levels = load_levels()
    for level in levels:
        if level["key"] == level_key:
            return level
    raise HTTPException(status_code=404, detail="Level not found")
