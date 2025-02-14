# gen/retriever.py

import logging
import os
import sys
from typing import List, Dict, Any

import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from gen.database import load_vector_db
from gen.search import generate_embedding, search_vector_db
from config import TOP_N, THRESHOLD

logger = logging.getLogger(__name__)

OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434")
CROSS_ENCODER_MODEL = os.getenv("CROSS_ENCODER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

# グローバル変数としてモデル・トークナイザをキャッシュ
_tokenizer = None
_model = None


def init_retriever() -> None:
    """
    アプリケーション起動時に一度だけ呼び出し、
    Cross Encoder のトークナイザとモデルをグローバルにロードする。
    """
    global _tokenizer, _model
    if _tokenizer is None or _model is None:
        logger.info("Initializing Cross Encoder model...")
        try:
            _tokenizer = AutoTokenizer.from_pretrained(CROSS_ENCODER_MODEL)
            _model = AutoModelForSequenceClassification.from_pretrained(CROSS_ENCODER_MODEL)
            _model.eval()
            logger.info(f"Cross Encoder model loaded successfully: {CROSS_ENCODER_MODEL}")
        except Exception as e:
            logger.error(f"😣 Failed to load Cross Encoder model: {e}")
            sys.exit(1)
    else:
        logger.info("Cross Encoder model is already initialized.")


def rerank_candidates(query: str, candidates: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Cross Encoder による再ランキングを行う。
    candidates は、各候補が "document" キーを持つ辞書のリストとする。
    """
    global _tokenizer, _model
    if _model is None or _tokenizer is None:
        # モデル未初期化の場合は、そのまま返すか、例外を投げる
        logger.warning("Cross Encoder model is not initialized. Skipping rerank.")
        return candidates

    for candidate in candidates:
        pair = (query, candidate["document"])
        inputs = _tokenizer(
            pair[0], pair[1],
            return_tensors="pt",
            truncation=True,
            padding=True
        )
        with torch.no_grad():
            outputs = _model(**inputs)
            # cross-encoder/ms-marco-MiniLM-L-6-v2 は [batch_size, 1] 的な出力になる。
            # logits.item() でスコアをスカラーとして取得
            score = outputs.logits.item()
        candidate["rerank_score"] = score

    # rerank_score に基づいて降順ソート
    return sorted(candidates, key=lambda x: x.get("rerank_score", 0.0), reverse=True)


def retrieve_context(question: str, top_n: int = TOP_N, threshold: float = THRESHOLD) -> str:
    """
    質問テキストから埋め込みを生成し、Dense 検索と Cross Encoder による再ランキングで
    上位 N 件の関連文書を取得する。

    Args:
        question (str): ユーザーの質問文
        top_n (int): 上位何件を取り出すか (config.py で管理)
        threshold (float): スコアしきい値

    Returns:
        str: 取得した文書を改行区切りでまとめた文字列
    """
    try:
        vector_db = load_vector_db()
        if not vector_db:
            logger.warning("Vector DB is empty.")
            return ""

        # Dense Retrieval
        query_embedding = generate_embedding(question)
        dense_candidates = search_vector_db(query_embedding, vector_db)
        logger.info(f"Dense Retrieval: {len(dense_candidates)} candidates obtained.")

        # Cross Encoder による再ランキング
        reranked_candidates = rerank_candidates(question, dense_candidates)
        logger.info("Reranking completed.")

        # 上位 top_n 件を採用 (threshold で除外するならここで判定)
        final_candidates = reranked_candidates[:top_n]

        # ドキュメント本文をまとめて返す
        context = "\n".join([f"・{doc['document']}" for doc in final_candidates])
        return context

    except Exception as e:
        logger.error(f"Error in retrieve_context: {e}")
        return ""
