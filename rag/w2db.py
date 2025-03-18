#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import re
import sys
import os
import datetime

LOG_FILE = ".wiki2db.log"
DATABASE_DIR = "./database"
DATABASE_FILE = os.path.join(DATABASE_DIR, "wiki.db")


def already_crawled(url: str, log_file: str) -> bool:
    """
    ログファイルを読み込み、指定したURLが既に処理済みか確認する。
    """
    if not os.path.exists(log_file):
        return False
    with open(log_file, "r", encoding="utf-8") as f:
        for line in f:
            if url in line:
                return True
    return False


def fetch_and_store(url: str, force_update: bool = False):
    """
    URL から HTML を取得し、不要な要素を削除した後、テキストをデータベースに保存する。
    """
    # 既に処理済みのURLならスキップ（-r時は強制実行）
    if not force_update and already_crawled(url, LOG_FILE):
        print(f"✅ {url} は既に処理済みです。")
        return

    print(f"🌍 URL取得中: {url}")

    # URLからHTMLを取得
    try:
        response = requests.get(url)
        response.raise_for_status()
    except Exception as e:
        print(f"❌ URLの取得エラー: {e}")
        return

    # BeautifulSoupでHTMLをパース
    soup = BeautifulSoup(response.text, "html.parser")
    content_div = soup.find(id="content")

    if content_div is None:
        print("❌ ID 'content' が見つかりませんでした。")
        return

    # 不要な要素を削除
    for elem in content_div.find_all(attrs={"role": "presentation"}):
        elem.decompose()
    for elem in content_div.find_all(class_=["vector-page-toolbar", "vector-toc-landmark", "vector-column-end"]):
        elem.decompose()
    for elem in content_div.find_all(id="p-lang-btn"):
        elem.decompose()

    # H1タイトルを取得
    title_tag = soup.find("h1")
    page_title = title_tag.get_text(strip=True) if title_tag else "No Title"

    # テキストを抽出し、余分な空白をまとめて1行に整形
    raw_text = content_div.get_text(separator=" ", strip=True)
    one_line_text = re.sub(r'\s+', ' ', raw_text)

    # データベース保存先ディレクトリの作成（存在しなければ）
    os.makedirs(DATABASE_DIR, exist_ok=True)

    # wiki.dbに追記
    try:
        with open(DATABASE_FILE, "a", encoding="utf-8") as f:
            f.write(one_line_text + "\n")
    except Exception as e:
        print(f"❌ データベースファイル書き込みエラー: {e}")
        return

    # ログファイルにタイムスタンプ付きでURLとタイトルを記録
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as log_f:
            timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
            log_f.write(f"[{timestamp}] {url} {page_title}\n")
    except Exception as e:
        print(f"❌ ログファイル書き込みエラー: {e}")
        return

    print(f"✅ データ保存完了: {url} ({page_title})")


def reprocess_logged_urls():
    """
    .wiki2db.log に記録されているURLをすべて再取得する。
    """
    if not os.path.exists(LOG_FILE):
        print("❌ ログファイルが存在しません。")
        sys.exit(1)

    print("🔄 過去に取得したURLを再処理中...")
    with open(LOG_FILE, "r", encoding="utf-8") as log_f:
        lines = log_f.readlines()

    urls = [line.split(" ")[1] for line in lines if len(line.split(" ")) > 1]

    for url in urls:
        fetch_and_store(url, force_update=True)


def main():
    if len(sys.argv) < 2:
        print("Usage: python w2db.py URL | -r")
        sys.exit(1)

    if sys.argv[1] == "-r":
        reprocess_logged_urls()
    else:
        fetch_and_store(sys.argv[1])


if __name__ == "__main__":
    main()
