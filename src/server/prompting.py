# server/prompting.py
import logging
from fastapi import HTTPException
from server.reader import read_uploaded_files  # 必要に応じて利用（ここでは利用していないが、他モジュールと連携する場合の例）
# 必要であれば、ベクトル検索などを行う retrieve_context をインポート
from server.searcher import retrieve_context

logger = logging.getLogger(__name__)

def generate_prompt(question: str, language: str, mode: str, file_content: str) -> str:
    """
    質問、使用言語、モード、ファイル内容に応じてプロンプトを生成する。
    """
    prompt = ""
    # モードごとの分岐
    if mode == "ask":
        if not file_content.strip():
            # ファイルが無い場合は外部のコンテキストを追加する例（retrieve_context など）
            context = retrieve_context(question, top_n=3)
            if context:
                prompt = (
                    "以下の情報を元に**日本語で質問**に答えてください。\n\n"
                    f"関連情報:\n{context}\n\n"
                    f"質問:\n{question}\n\n"
                )
            else:
                prompt = f"質問:{question}\n\n質問と同じ言語で回答してください"
        else:
            prompt = f"{file_content}\n\n以下の情報を踏まえて、質問: {question}\n"

    elif mode == "code":
        if file_content.strip():
            str1 = "以下のコードの内容をよく確認したうえで最適化および質問に答えてください。"
            str2 = f"要件(質問):\n{question}"
            str3 = f"技術要件: - 使用言語: [{language}] \n使用OS: Linux"
            str4 = f"コード概要:\n\n```{file_content}```"
            prompt = f"{str1}\n{str2}\n{str3}\n{str4}"
        else:
            str1 = "以下の機能を実装するためのコードを生成してください:"
            str2 = f"機能概要:\n{question}"
            str3 = f"技術要件: - 使用言語: [{language}] \n使用OS: Linux"
            prompt = f"{str1}\n{str2}\n{str3}"

    elif mode == "docs":
        if file_content.strip():
            str1 = "提供されるファイルを解析したうえで、以下の質問に沿ったドキュメントをMarkdown形式で提示してください。"
            str2 = f"要件(質問):\n{question}"
            str3 = f"ファイル概要:\n```{file_content}```"
            prompt = f"{str1}\n{str2}\n{str3}"
        else:
            str1 = (
                "以下の質問に沿ったドキュメントをMarkdown形式で提示してください。"
                "また、詳細なドキュメントになるよう努めてください。"
            )
            str2 = f"要件(質問):\n{question}"
            prompt = f"{str1}\n{str2}"

    elif mode == "fix":
        str1 = "以下のバグの修正案を提示してください。改善点と完全なコードを提示してください："
        str2 = f"バグの症状:\n{question}"
        str3 = f"現在のコード:\n```{file_content}```"
        prompt = f"{str1}\n{str2}\n{str3}"

    else:
        prompt = f"{question}\n\n{file_content}"

    return prompt
