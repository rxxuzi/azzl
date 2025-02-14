# gen/search.py
import os
import sys
import logging
from dotenv import load_dotenv
import ollama
import chromadb
import json
import numpy as np
import requests
import faiss
from config import THRESHOLD, TOP_N

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434").rstrip('/')
os.environ["OLLAMA_HOST"] = OLLAMA_ENDPOINT

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "mxbai-embed-large")

s = 3  # 検索候補の倍率

# FAISS インデックスの作成（HNSW 使用）
faiss_index = None
def build_faiss_index(vector_db: list, d: int):
    """
    ベクトルデータベースに基づいて FAISS インデックスを構築する。
    """
    global faiss_index
    if not vector_db:
        logger.warning("Vector DB is empty, skipping FAISS index build.")
        return

    index = faiss.IndexHNSWFlat(d, 32)  # HNSW 構造を使用（32 は近傍数）
    embeddings = np.array([entry["embedding"] for entry in vector_db], dtype=np.float32)

    index.add(embeddings)
    faiss_index = index
    logger.info("FAISS index built successfully.")


def generate_embedding(text: str) -> list:
    """
    テキストを Ollama を用いて埋め込みベクトルに変換する。
    """
    try:
        response = requests.get(f"{OLLAMA_ENDPOINT}/api/version", timeout=2)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection failed: {e}")
        sys.exit(1)

    try:
        response = requests.post(
            f"{OLLAMA_ENDPOINT}/api/embed",
            headers={"Content-Type": "application/json"},
            json={"model": EMBEDDING_MODEL, "input": text},
            timeout=5
        )
        response.raise_for_status()

        response_json = response.json()
        return response_json.get("embeddings", [[]])[0]

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        sys.exit(1)


def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    コサイン類似度を計算する。
    """
    vec1 = np.array(vec1, dtype=np.float32)
    vec2 = np.array(vec2, dtype=np.float32)

    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return np.dot(vec1, vec2) / (norm1 * norm2)


def search_vector_db(query_embedding: list, vector_db: list, top_n: int = TOP_N) -> list:
    """
    ベクトルデータベースから、指定された埋め込みとコサイン類似度の高い上位 N * s 件の文書を返す。
    各候補に Dense Retrieval の類似度スコアを 'similarity' キーとして追加する。
    """
    global faiss_index

    if faiss_index is None:
        logger.warning("FAISS index not built. Falling back to brute-force search.")

        # 通常の類似度計算（遅い）
        scored = []
        for entry in vector_db:
            embedding = entry.get("embedding", [])
            similarity = cosine_similarity(query_embedding, embedding)
            candidate = entry.copy()
            candidate["similarity"] = similarity
            scored.append(candidate)
        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_n * s]

    # FAISS を使用した高速検索
    query_vec = np.array([query_embedding], dtype=np.float32)
    distances, indices = faiss_index.search(query_vec, top_n * s)

    results = []
    for i in range(len(indices[0])):
        idx = indices[0][i]
        if idx < len(vector_db):
            candidate = vector_db[idx].copy()
            candidate["similarity"] = 1 - distances[0][i]  # FAISS の距離を類似度に変換
            results.append(candidate)

    return results


def setup_chroma_collection():
    client = chromadb.Client()
    if "docs" in [col.name for col in client.list_collections()]:
        client.delete_collection("docs")
    return client.create_collection("docs")