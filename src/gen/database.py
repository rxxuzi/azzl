# gen/database.py
import os
import json
from dotenv import load_dotenv

load_dotenv()

# 環境変数からファイルパスを取得
DATABASE_PATH = os.getenv("DATABASE", "database.json")
VECTOR_DB_PATH = os.getenv("VECTOR_DB", "vector_database.json")

def load_documents() -> list:
    """
    原資料ファイルからドキュメントリストを読み込む。
    ファイルが存在しなければ例外を発生させる。
    """
    if not os.path.exists(DATABASE_PATH):
        raise FileNotFoundError(f"データベースファイル '{DATABASE_PATH}' が見つかりません。")
    with open(DATABASE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def load_vector_db() -> list:
    """
    ベクトルデータベースを読み込む。
    ファイルが存在しなければ空のリストを返す。
    """
    if not os.path.exists(VECTOR_DB_PATH):
        return []
    with open(VECTOR_DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_vector_db(vector_db: list):
    """
    ベクトルデータベースをファイルに保存する。
    """
    with open(VECTOR_DB_PATH, "w", encoding="utf-8") as f:
        json.dump(vector_db, f, ensure_ascii=False, indent=4)
