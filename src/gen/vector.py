# gen/vector.py
import os
import sys
import logging
from dotenv import load_dotenv
import ollama
import chromadb
import json
import requests
from config import THRESHOLD, TOP_N

load_dotenv()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434").rstrip('/')
os.environ["OLLAMA_HOST"] = OLLAMA_ENDPOINT

EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "mxbai-embed-large")

def generate_embedding(text: str) -> list:
    try:
        response = requests.get(f"{OLLAMA_ENDPOINT}/api/version")
    except requests.exceptions.RequestException as e:
        logger.error(f"Ollama connection failed: {e}")
        sys.exit(1)

    try:
        response = requests.post(
            f"{OLLAMA_ENDPOINT}/api/embed",
            headers={"Content-Type": "application/json"},
            json={
                "model": EMBEDDING_MODEL,
                "input": text
            }
        )

        if response.status_code != 200:
            logger.error(f"Embedding API failed: {response.status_code}, {response.text}")
            sys.exit(1)

        response_json = response.json()
        return response_json.get("embeddings", [[]])[0]

    except Exception as e:
        logger.error(f"Embedding generation failed: {e}")
        sys.exit(1)

def cosine_similarity(vec1: list, vec2: list) -> float:
    """
    コサイン類似度を計算する。
    """
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a ** 2 for a in vec1) ** 0.5
    magnitude2 = sum(b ** 2 for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)

def search_vector_db(query_embedding: list, vector_db: list, top_n: int = TOP_N) -> list:
    """
    ベクトルデータベースから、指定された埋め込みとコサイン類似度の高い上位 N 件の文書を返す。
    各候補に dense な類似度スコアを 'similarity' キーとして追加する。
    """
    scored = []
    for entry in vector_db:
        embedding = entry.get("embedding", [])
        similarity = cosine_similarity(query_embedding, embedding)
        candidate = entry.copy()
        candidate["similarity"] = similarity
        scored.append(candidate)
    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return scored[:top_n]

def setup_chroma_collection():
    client = chromadb.Client()
    if "docs" in [col.name for col in client.list_collections()]:
        client.delete_collection("docs")
    return client.create_collection("docs")