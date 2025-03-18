#!/usr/bin/env python3
import requests
import pdfplumber
import os
import sys
import datetime
import argparse
from markdownify import markdownify as md

LOG_FILE = ".pdf2db.log"
DATABASE_DIR = "./database"
DATABASE_FILE = os.path.join(DATABASE_DIR, "pdf.db")
PDF_SAVE_DIR = os.path.join(DATABASE_DIR, "pdf")  # PDF 保存ディレクトリ


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


def download_pdf(url):
    """
    指定されたURLからPDFをダウンロードし、一時ファイルに保存する。
    """
    print(f"📥 ダウンロード中: {url}")
    response = requests.get(url)
    response.raise_for_status()  # エラーチェック

    pdf_filename = url.split("/")[-1]  # URL からファイル名を取得
    temp_pdf_path = os.path.join(DATABASE_DIR, "temp.pdf")

    with open(temp_pdf_path, "wb") as f:
        f.write(response.content)

    return temp_pdf_path, pdf_filename


def extract_text_from_pdf(pdf_path):
    """
    PDFファイルからテキストを抽出する。
    """
    print("🔍 PDF からテキストを抽出中...")
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            extracted_text = page.extract_text()
            if extracted_text:
                text += extracted_text + "\n"
    return text.strip()


def save_to_database(text):
    """
    抽出したテキストをデータベースファイルに1行ずつ保存する。
    """
    os.makedirs(DATABASE_DIR, exist_ok=True)
    with open(DATABASE_FILE, "a", encoding="utf-8") as db_file:
        for line in text.splitlines():
            db_file.write(line.strip() + "\n")


def log_url(url, pdf_filename):
    """
    処理したURLをログファイルに記録する。
    """
    with open(LOG_FILE, "a", encoding="utf-8") as log_file:
        timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
        log_file.write(f"[{timestamp}] {url} {pdf_filename}\n")


def save_pdf(pdf_path, pdf_filename):
    """
    PDFを保存する（-s オプション有効時）
    """
    os.makedirs(PDF_SAVE_DIR, exist_ok=True)
    save_path = os.path.join(PDF_SAVE_DIR, pdf_filename)
    os.rename(pdf_path, save_path)
    print(f"📂 PDF を保存しました: {save_path}")
    return save_path


def fetch_and_store(url: str, save_pdf_flag: bool = False, force_update: bool = False):
    """
    URL から PDF を取得し、テキストを Markdown 形式でデータベースに保存する。
    """
    # 既に処理済みのURLならスキップ（-r時は強制実行）
    if not force_update and already_crawled(url, LOG_FILE):
        print(f"✅ {url} は既に処理済みです。")
        return

    # PDFをダウンロード
    try:
        pdf_path, pdf_filename = download_pdf(url)
    except Exception as e:
        print(f"❌ PDFのダウンロードエラー: {e}")
        return

    # PDFからテキストを抽出
    text = extract_text_from_pdf(pdf_path)
    if not text:
        print("⚠️ 抽出されたテキストがありません。")
        return

    # テキストを Markdown に変換
    markdown_text = md(text)

    # データベースに保存
    save_to_database(markdown_text)
    print(f"✅ データ保存完了: {DATABASE_FILE}")

    # ログに記録
    log_url(url, pdf_filename)
    print(f"📝 ログ記録完了: {LOG_FILE}")

    # PDF を保存するオプションが有効なら保存
    if save_pdf_flag:
        save_pdf(pdf_path, pdf_filename)
    else:
        os.remove(pdf_path)  # 一時ファイル削除


def reprocess_logged_urls(save_pdf_flag: bool = False):
    """
    .pdf2db.log に記録されているURLをすべて再取得する。
    """
    if not os.path.exists(LOG_FILE):
        print("❌ ログファイルが存在しません。")
        sys.exit(1)

    print("🔄 過去に取得したPDFを再処理中...")
    with open(LOG_FILE, "r", encoding="utf-8") as log_f:
        lines = log_f.readlines()

    urls = [line.split(" ")[1] for line in lines if len(line.split(" ")) > 1]

    for url in urls:
        fetch_and_store(url, save_pdf_flag, force_update=True)


def main():
    parser = argparse.ArgumentParser(
        description="PDF から Markdown ベースのデータベースを作成するスクリプト",
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument(
        "url",
        nargs="?",
        help="入力となる PDF の URL（または -r で過去の URL を再処理）"
    )
    parser.add_argument(
        "-r", "--reprocess",
        action="store_true",
        help="過去の PDF URL を再取得"
    )
    parser.add_argument(
        "-s", "--save",
        action="store_true",
        help="PDF ファイルを保存"
    )

    args = parser.parse_args()

    if args.reprocess:
        reprocess_logged_urls(args.save)
    elif args.url:
        fetch_and_store(args.url, args.save)
    else:
        print("Usage: python p2d.py <PDF_URL> | -r [-s]")
        sys.exit(1)


if __name__ == "__main__":
    main()
