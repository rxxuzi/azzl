# server/handler.py
import os
import json
import httpx
import tempfile
import logging
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Form, File, UploadFile
from fastapi.responses import StreamingResponse
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from server.eval import eval_router
from server.reader import read_uploaded_files
from gen.prompting import generate_prompt

load_dotenv()

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

app = FastAPI()

# CORS の設定：すべてのオリジンを許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(eval_router, prefix="/api")

OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434")
OLLAMA_GEN_URL = f"{OLLAMA_ENDPOINT.rstrip('/')}/api/generate"
# OLLAMA_CHAT_URL = f"{OLLAMA_ENDPOINT.rstrip('/')}/api/chat" # TODO
DEFAULT_MODEL = os.getenv("LLM_MODEL", "azzl:guava")

@app.post("/api/ask")
async def handle_ask(
    question: str = Form(...),
    language: str = Form(""),
    mode: str = Form("ask"),
    model: Optional[str] = Form(None),
    files: List[UploadFile] = File([]),
):
    logger.info(f"Received request with mode: {mode}, model: {model}, files: {len(files)}")
    for file in files:
        logger.info(f"File received: {file.filename}")


    if not model:
        model = DEFAULT_MODEL

    # reader.py の関数を呼び出してファイルの内容を取得
    combined_file_content = await read_uploaded_files(files)

    # prompting.py の関数を使ってプロンプトを生成
    prompt = generate_prompt(question, language, mode, combined_file_content)

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

