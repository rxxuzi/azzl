# server/handler.py
import os
import sys
import tempfile
import json
from typing import List, Optional
import httpx
from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from markitdown import MarkItDown
import logging

# ログの設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 高レベルの検索処理を import
from server.searcher import retrieve_context

load_dotenv()

app = FastAPI()

# CORS 設定：すべてのオリジンを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 環境変数から設定を取得
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434")
# ※末尾の "/" を除去しておく
OLLAMA_GEN_URL = f"{OLLAMA_ENDPOINT.rstrip('/')}/api/generate"
DEFAULT_MODEL = os.getenv("LLM_MODEL", "azzl:guava")

ALLOWED_EXTENSIONS = {".c", ".py", ".java", ".js", ".cpp", ".go", ".txt", ".md", ".html", ".php", ".tsx"}
MARKITDOWN_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".jpg", ".jpeg", ".png", ".html", ".csv", ".json", ".xml"}

md_converter = MarkItDown()

@app.post("/api/ask")
async def handle_ask(
    question: str = Form(...),
    language: str = Form(""),
    mode: str = Form("ask"),
    model: Optional[str] = Form(None),
    files: List[UploadFile] = File([])
):
    if not model:
        model = DEFAULT_MODEL

    combined_file_content = ""
    for file in files:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()
        if ext in MARKITDOWN_EXTENSIONS:
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                    tmp.write(await file.read())
                    tmp_path = tmp.name
                result = md_converter.convert(tmp_path)
                file_text = result.text_content or ""
                combined_file_content += f"\n\n--- Start of {filename} ---\n{file_text}\n--- End of {filename} ---\n"
                os.remove(tmp_path)
            except Exception as e:
                logger.error(f"Error converting {filename}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error converting {filename}: {str(e)}")
        elif ext in ALLOWED_EXTENSIONS:
            try:
                content = await file.read()
                text = content.decode("utf-8", errors="ignore")
                combined_file_content += f"\n\n--- Start of {filename} ---\n{text}\n--- End of {filename} ---\n"
            except Exception as e:
                logger.error(f"Error reading {filename}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error reading {filename}: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Illegal or unsupported file format: {filename}")

    pr_mode = 1

    # プロンプト生成：モード "ask" でファイルが無い場合はベクトル検索結果を付加
    if mode == "ask" and not combined_file_content.strip():
        # retrieve_context 内で例外はキャッチして空文字を返すようにしているので安心
        context = retrieve_context(question, top_n=3)
        if context:
            pr_mode = 2
            prompt = f"以下の情報を元に**日本語で質問**に答えてください。\n\n関連情報:\n{context}\n\n質問:\n{question}\n\n"
        else:
            pr_mode = 1
            prompt = f"質問:{question}\n\n 質問と同じ言語で回答してください"
    else:
        pr_mode = 0
        prompt = f"{combined_file_content}\n\n 質問: {question}\n"

    logger.info(f"Prompt mode: {pr_mode}")
    logger.info(f"Constructed prompt (first 100 chars): {prompt[:100]}...")

    ollama_req = {
        "model": model,
        "prompt": prompt
    }
    headers = {"Content-Type": "application/json"}
    
    async def stream_response():
        async with httpx.AsyncClient(timeout=None) as client:
            try:
                async with client.stream("POST", OLLAMA_GEN_URL, json=ollama_req, headers=headers) as resp:
                    if resp.status_code != 200:
                        content = await resp.aread()
                        logger.error(f"Ollama API error: {resp.status_code} - {content.decode()}")
                        raise HTTPException(status_code=resp.status_code, detail=content.decode())
                    async for chunk in resp.aiter_text():
                        yield chunk
            except Exception as e:
                logger.error(f"Error streaming from Ollama: {str(e)}")
                yield f"Error: {e}"

    return StreamingResponse(stream_response(), media_type="application/json")

# 評価用エンドポイントは server/eval.py にて実装しているので include する
from server.eval import router as eval_router
app.include_router(eval_router, prefix="/api")
