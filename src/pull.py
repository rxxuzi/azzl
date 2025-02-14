import sys
import os
import argparse
import json
import time
import dotenv
import threading
from queue import Queue
from rich.progress import track
from rich.prompt import Confirm
from rich.console import Console
from gen.vector import generate_embedding, setup_chroma_collection
from gen.database import save_vector_db

# .envを読み込む
dotenv.load_dotenv()

# デフォルトパス
DEFAULT_DATABASE = os.getenv("DATABASE", "../db/database.json")
DEFAULT_VECTOR_DB = os.getenv("VECTOR_DB", "../db/vec.db")
DEFAULT_THREADS = 4  # 並列処理のデフォルトスレッド数

console = Console()


def load_documents_from_file(input_path: str) -> list:
    """ 指定されたファイルからデータを読み込む """
    if not os.path.exists(input_path):
        print(f"❌ エラー: データベースファイル '{input_path}' が見つかりません。")
        sys.exit(1)

    with open(input_path, "r", encoding="utf-8") as f:
        return json.load(f)


def worker(queue: Queue, results: list):
    """ ワーカースレッド：キューからデータを取り出し、埋め込みを生成 """
    while not queue.empty():
        i, doc = queue.get()
        embedding = generate_embedding(doc)
        results[i] = {"id": str(i), "embedding": embedding, "document": doc}
        queue.task_done()


def create_vector_db(input_file: str, output_file: str, threads: int, force: bool = False, verbose: bool = False):
    """
    ベクトルDBを並列処理で作成し、出力ファイルに保存する。
    """
    start_time = time.time()

    # 出力ファイルの存在チェック
    if not force and os.path.exists(output_file):
        print(f"⚠️  警告: 出力先 '{output_file}' は既に存在します。")
        if not Confirm.ask("上書きしますか？"):
            print("🛑 処理を中断しました。")
            sys.exit(1)

    print("🔧 ChromaDB のセットアップ中...")
    collection = setup_chroma_collection()

    print(f"📂 データを読み込み中: {input_file}")
    documents = load_documents_from_file(input_file)

    # キューと結果リストの作成
    queue = Queue()
    results = [None] * len(documents)

    for i, doc in enumerate(documents):
        queue.put((i, doc))

    print(f"⚡ 並列処理 ({threads}スレッド) で埋め込みを生成中...")

    # スレッドを作成
    workers = []
    for _ in range(threads):
        thread = threading.Thread(target=worker, args=(queue, results))
        thread.start()
        workers.append(thread)

    # 進捗バーを表示
    for _ in track(range(len(documents)), description="📝 ベクトルDBを作成中..."):
        queue.join()

    # 全スレッドの終了を待つ
    for thread in workers:
        thread.join()

    # ChromaDB にデータを追加
    for item in results:
        collection.add(
            ids=[item["id"]],
            embeddings=[item["embedding"]],
            documents=[item["document"]]
        )

    save_vector_db_to_file(results, output_file)

    end_time = time.time()
    elapsed_time = end_time - start_time

    print(f"✅ ベクトルDB作成完了: {output_file}")

    # 詳細出力（-v オプション）
    if verbose:
        db_size = os.path.getsize(output_file) / (1024 * 1024)  # MB単位
        print(f"🕒 処理時間: {elapsed_time:.2f} 秒")
        print(f"📦 DB サイズ: {db_size:.2f} MB")
        print(f"📄 ドキュメント数: {len(documents)}")


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
        "-t", "--threads",
        type=int,
        default=DEFAULT_THREADS,
        help=f"並列処理のスレッド数 (デフォルト: {DEFAULT_THREADS})"
    )
    parser.add_argument(
        "-f", "--force",
        action="store_true",
        help="出力ファイルが既に存在する場合、上書きする"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="詳細情報を表示 (処理時間、DBサイズなど)"
    )

    args = parser.parse_args()

    input_path = args.input_file if args.input_file else DEFAULT_DATABASE
    output_path = args.output if args.output else DEFAULT_VECTOR_DB

    print(f"📌 入力ファイル: {input_path}")
    print(f"📌 出力ファイル: {output_path}")
    print(f"🔄 スレッド数: {args.threads}")

    create_vector_db(input_path, output_path, args.threads, force=args.force, verbose=args.verbose)


if __name__ == "__main__":
    main()
