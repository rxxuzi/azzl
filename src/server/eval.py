# server/eval.py
import os
import json
from datetime import datetime
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# OUT_DIR を環境変数から取得（デフォルトは "../out"）
OUT_DIR = os.getenv("OUT_DIR", "../out")

class Evaluation(BaseModel):
    q: str  # 質問
    a: str  # 回答
    t: int  # タイムスタンプ（epoch）
    i: str  # ID
    m: str  # モデル

def save_evaluation(evaluation: Evaluation, category: str):
    """
    評価データを OUT_DIR 内の category フォルダに保存する
    """
    directory = os.path.join(OUT_DIR, category)
    os.makedirs(directory, exist_ok=True)

    timestamp_str = datetime.now().strftime("%Y%m%d%H%M%S")
    filename = os.path.join(directory, f"{evaluation.i}_{timestamp_str}.json")

    try:
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(evaluation.dict(), f, ensure_ascii=False, indent=2)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/eval/good")
async def eval_good(evaluation: Evaluation):
    """
    良い評価のデータを保存
    """
    save_evaluation(evaluation, "good")
    return JSONResponse(status_code=200, content={"status": "success"})

@router.post("/eval/bad")
async def eval_bad(evaluation: Evaluation):
    """
    悪い評価のデータを保存
    """
    save_evaluation(evaluation, "bad")
    return JSONResponse(status_code=200, content={"status": "success"})

@router.post("/eval/report")
async def eval_report(evaluation: Evaluation):
    """
    レポート評価のデータを保存
    """
    save_evaluation(evaluation, "report")
    return JSONResponse(status_code=200, content={"status": "success"})
