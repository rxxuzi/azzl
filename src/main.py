# main.py
import sys
import os
import socket
import uvicorn
from dotenv import load_dotenv
from server.handler import app  # サーバーのエンドポイント（handler.py）をインポート

load_dotenv()  # .envの読み込み

# コマンドライン引数で静的ファイルの提供の有無を決定（例："-b"オプションでバイパス）
serve_static = True
if "-b" in sys.argv:
    serve_static = False

if serve_static:
    from fastapi.staticfiles import StaticFiles
    serve_root = os.getenv("SERVE_ROOT", "../www")
    app.mount("/", StaticFiles(directory=serve_root, html=True), name="static")

if __name__ == "__main__":
    hostname = socket.gethostname()
    try:
        ip_address = socket.gethostbyname(hostname)
    except Exception:
        ip_address = "0.0.0.0"
    port = int(os.getenv("SERVE_PORT", 9500))
    print(f"Serve at -> http://{ip_address}:{port}/")
    uvicorn.run(app, host="0.0.0.0", port=port)
