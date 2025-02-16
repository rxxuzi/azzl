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
from gen.search import generate_embedding, setup_chroma_collection
from gen.database import save_vector_db

# .envを読み込む
dotenv.load_dotenv()

# デフォルトパス（入力はTXT形式に変更）
DEFAULT_DATABASE = os.getenv("DATABASE", "../db/database.txt")
DEFAULT_VECTOR_DB = os.getenv("VECTOR_DB", "../db/vec.db")
DEFAULT_THREADS = 4  # 並列処理のデフォルトスレッド数

console = Console()

def load_documents_from_files(input_paths: list) -> list:
    """
    複数のTXTファイルからデータを読み込む。
    各行が1ドキュメントとなり、空行は無視します。
    """
    documents = []
    for path in input_paths:
        if not os.path.exists(path):
            print(f"❌ エラー: データベースファイル '{path}' が見つかりません。")
            sys.exit(1)
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    documents.append(line)
    return documents

def worker(queue: Queue, results: list):
    """ワーカースレッド：キューからデータを取り出し、埋め込みを生成します。"""
    while not queue.empty():
        i, doc = queue.get()
        embedding = generate_embedding(doc)
        results[i] = {"id": str(i), "embedding": embedding, "document": doc}
        queue.task_done()

def create_vector_db(input_files: list, output_file: str, threads: int, force: bool = False, verbose: bool = False):
    """
    複数の入力ファイルからドキュメントを読み込み、並列処理で埋め込みを生成し、
    ベクトルDBを作成して出力ファイルに保存します。
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

    # 複数ファイルからデータを読み込み
    print(f"📂 データを読み込み中: {', '.join(input_files)}")
    documents = load_documents_from_files(input_files)

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

    # 進捗バーを表示しながら待機
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
    if verbose:
        db_size = os.path.getsize(output_file) / (1024 * 1024)  # MB単位
        print(f"🕒 処理時間: {elapsed_time:.2f} 秒")
        print(f"📦 DB サイズ: {db_size:.2f} MB")
        print(f"📄 ドキュメント数: {len(documents)}")

def save_vector_db_to_file(vector_db: list, output_path: str):
    """ベクトルDBをJSON形式でファイルに保存します。"""
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(vector_db, f, ensure_ascii=False, indent=4)

def main():
    parser = argparse.ArgumentParser(
        description="ベクトルDB作成スクリプト (RAG用)",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "input_files",
        nargs="*",
        help="入力となる TXT ファイル群 (省略時は .env の DATABASE を使用)"
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
        help="出力ファイルが既に存在する場合、上書きします。"
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="詳細情報を表示します (処理時間、DBサイズなど)。"
    )

    args = parser.parse_args()

    # 入力ファイルが指定されなかった場合は、デフォルトのファイルを使用
    input_files = args.input_files if args.input_files else [DEFAULT_DATABASE]
    output_path = args.output if args.output else DEFAULT_VECTOR_DB

    print(f"📌 入力ファイル: {', '.join(input_files)}")
    print(f"📌 出力ファイル: {output_path}")
    print(f"🔄 スレッド数: {args.threads}")

    create_vector_db(input_files, output_path, args.threads, force=args.force, verbose=args.verbose)

if __name__ == "__main__":
    main()
