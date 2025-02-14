import sys
import os
import socket
import psutil
import uvicorn
from dotenv import load_dotenv
from contextlib import asynccontextmanager

from server.handler import app
from gen.retriever import init_retriever
from fastapi.staticfiles import StaticFiles

load_dotenv()


@asynccontextmanager
async def lifespan(app):
    """
    サーバー起動時にモデルのロードを実行し、シャットダウン時に後処理があれば実行する。
    """
    print("🔄 Initializing retriever models...")
    init_retriever()  # モデルのロード
    print("✅ Model initialization complete. Server is ready.")
    yield  # ここでアプリの起動を待機
    print("🛑 Shutting down server...")

app.router.lifespan_context = lifespan

def get_local_ip() -> str:
    try:
        for interface, addrs in psutil.net_if_addrs().items():
            for addr in addrs:
                if addr.family == socket.AF_INET and not addr.address.startswith("127."):
                    return addr.address
    except Exception as e:
        print("⚠ Failed to get local IP. Using 0.0.0.0.")    
    return "0.0.0.0"

serve_static = "-b" not in sys.argv
if serve_static:
    serve_root = os.getenv("SERVE_ROOT", "../www")
    app.mount("/", StaticFiles(directory=serve_root, html=True), name="static")

if __name__ == "__main__":
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except Exception:
        ip_address = "0.0.0.0"

    port = int(os.getenv("SERVE_PORT", 9500))
    print(f"🚀 Serve at -> http://{get_local_ip()}:{port}/")

    # Uvicorn で FastAPI サーバーを起動
    uvicorn.run(app, host="0.0.0.0", port=port)
