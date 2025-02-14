import sys
import os
import argparse
import json
import dotenv
from rich.progress import track
from rich.prompt import Confirm
from gen.vector import generate_embedding, setup_chroma_collection
from gen.database import save_vector_db

# .envを読み込む
dotenv.load_dotenv()

# デフォルトパス
DEFAULT_DATABASE = os.getenv("DATABASE", "../db/database.json")
DEFAULT_VECTOR_DB = os.getenv("VECTOR_DB", "../db/vec.db")


def load_documents_from_file(input_path: str) -> list:
    """ 指定されたファイルからデータを読み込む """
    if not os.path.exists(input_path):
        print(f"❌ エラー: データベースファイル '{input_path}' が見つかりません。")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        return json.load(f)


def create_vector_db(input_file: str, output_file: str, force: bool = False):
    if not force and os.path.exists(output_file):
        print(f"⚠️  警告: 出力先 '{output_file}' は既に存在します。")
        if not Confirm.ask("上書きしますか？"):
            print("🛑 処理を中断しました。")
            sys.exit(1)

    print("🔧 ChromaDB のセットアップ中...")
    collection = setup_chroma_collection()

    print(f"📂 データを読み込み中: {input_file}")
    documents = load_documents_from_file(input_file)
    vector_db = []

    for i, doc in track(enumerate(documents), description="📝 ベクトルDBを作成中...", total=len(documents)):
        embedding = generate_embedding(doc)
        vector_db.append({
            "id": str(i),
            "embedding": embedding,
            "document": doc
        })
        collection.add(
            ids=[str(i)],
            embeddings=[embedding],
            documents=[doc]
        )

    save_vector_db_to_file(vector_db, output_file)
    print(f"✅ ベクトルDB作成完了: {output_file}")


def save_vector_db_to_file(vector_db: list, output_path: str):
    """ ベクトルDBをファイルに保存する """
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(vector_db, f, ensure_ascii=False, indent=4)


def main():
    parser = argparse.ArgumentParser(
        description="ベクトルDB作成スクリプト (RAG用)",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        help="入力となる JSON ファイル (省略時は .env の DATABASE を使用)"
    )
    parser.add_argument(
        "-o", "--output",
        help="出力ファイル (省略時は .env の VECTOR_DB を使用)"
    )
    parser.add_argument(
        "-f", "--force",
        action="store_true",
        help="出力ファイルが既に存在する場合、上書きする"
    )

    args = parser.parse_args()

    input_path = args.input_file if args.input_file else DEFAULT_DATABASE
    output_path = args.output if args.output else DEFAULT_VECTOR_DB

    print(f"📌 入力ファイル: {input_path}")
    print(f"📌 出力ファイル: {output_path}")

    create_vector_db(input_path, output_path, force=args.force)


if __name__ == "__main__":
    main()
