# gen/prompting.py
import logging
from fastapi import HTTPException
from server.reader import read_uploaded_files
from gen.retriever import retrieve_context
from config import TOP_N

logger = logging.getLogger(__name__)

def generate_prompt(question: str, language: str, mode: str, file_content: str, reason: bool) -> str:
    """
    質問、使用言語、モード、ファイル内容に応じてプロンプトを生成する関数。
    各モードに適した文脈や技術要件を含めたプロンプトを返す。

    Args:
        question (str): ユーザーからの質問文。
        language (str): 使用言語。
        mode (str): プロンプト生成モード（"ask", "code", "docs", "deep")
        file_content (str): アップロードされたファイルの内容。

    Returns:
        str: 生成されたプロンプト文字列。
    """

    prompt = ""
    if mode == "ask":
        if not file_content.strip():
            context = retrieve_context(question, top_n=TOP_N)
            if context:
                prompt = (
                    "以下の関連情報をもとに、**日本語で**質問に対する詳細な回答を作成してください。\n\n"
                    f"【関連情報】\n{context}\n\n"
                    f"【質問】\n{question}\n\n"
                )
            else:
                prompt = f"【質問】: {question}\n\n質問と同じ言語で回答してください。"
        else:
            prompt = f"{file_content}\n\n以下の情報を踏まえて、質問: {question}\n"
    elif mode == "code":
        if file_content.strip():
            prompt = (
                "以下のコードの内容を詳細に確認し、最適化案および質問に対する回答を示してください。\n\n"
                f"【要件】\n{question}\n\n"
                f"【技術要件】\n- 使用言語: {language}\n- 対象OS: Linux\n\n"
                f"【コード概要】\n```{file_content}```"
            )
        else:
            prompt = (
                "以下の機能を実装するためのコードを生成してください。\n\n"
                f"【機能概要】\n{question}\n\n"
                f"【技術要件】\n- 使用言語: {language}\n- 対象OS: Linux"
            )
    elif mode == "docs":
        if file_content.strip():
            prompt = (
                "提供されたファイルの内容を解析し、それに基づいた詳細なドキュメントをMarkdown形式で作成してください。\n\n"
                "### 【作成ルール】\n"
                "- Markdown形式を使用する。\n"
                "- 適切な見出し（# ～ ####）をつける。\n"
                "- 箇条書き、表、コードブロックを適宜活用する。\n"
                "- 明確で簡潔な説明を書く。\n\n"
                f"### 【質問】\n{question}\n\n"
                f"### 【ファイル概要】\n```\n{file_content}\n```"
            )
        else:
            prompt = (
                "以下の質問に基づき、詳細で分かりやすいMarkdown形式のドキュメントを作成してください。\n\n"
                "### 【作成ルール】\n"
                "- Markdown形式を使用する。\n"
                "- 適切な見出し（# ～ ####）をつける。\n"
                "- 箇条書き、表、コードブロックを適宜活用する。\n"
                "- 明確で簡潔な説明を書く。\n\n"
                f"### 【質問】\n{question}"
            )

    elif mode == "deep":
        context = retrieve_context(question, top_n=TOP_N)
        if context:
            prompt = (
                "以下の関連情報をもとに、**日本語で**質問に対する詳細な回答を作成してください。\n\n"
                f"【関連情報】\n{context}\n\n"
                f"【質問】\n{question}\n\n"
                f"考えられるステップを一つずつ明示しながら、論理的に考えて答えを導いてください。"
            )
        else:
            prompt = f"【質問】: {question}\n\n質問と同じ言語で回答してください。"

    else:
        prompt = f"{question}\n\n{file_content}"
    return prompt
