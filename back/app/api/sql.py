from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from app.core.executor import SQLExecutor
from app.core.diagnosis import SQLDiagnosis
from app.core.llm import llm_service

router = APIRouter()

class ExecuteRequest(BaseModel):
    sql: str
    init_sql: Optional[str] = None

class CheckRequest(BaseModel):
    user_sql: str
    answer_sql: str
    init_sql: str

class DiagnoseRequest(BaseModel):
    user_sql: str
    answer_sql: str

@router.post("/execute")
async def execute_sql(req: ExecuteRequest):
    try:
        return SQLExecutor.execute(req.sql, req.init_sql)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/check")
async def check_sql(req: CheckRequest):
    try:
        is_correct = SQLExecutor.check_result(req.user_sql, req.answer_sql, req.init_sql)
        return {"is_correct": is_correct}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/diagnose")
async def diagnose_sql(req: DiagnoseRequest):
    try:
        # 1. 规则诊断
        diagnosis = SQLDiagnosis.diagnose(req.user_sql, req.answer_sql)
        
        # 2. LLM 增强反馈
        llm_feedback = llm_service.generate_feedback(req.user_sql, req.answer_sql, diagnosis)
        
        return {
            "results": diagnosis,
            "llm_feedback": llm_feedback
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
