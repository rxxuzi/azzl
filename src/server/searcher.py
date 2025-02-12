# server/searcher.py
import logging
from gen.database import load_vector_db
from gen.vector import generate_embedding, search_vector_db
import os

logger = logging.getLogger(__name__)
OLLAMA_ENDPOINT = os.getenv("OLLAMA_ENDPOINT", "http://127.0.0.1:11434")


def retrieve_context(question: str, top_n: int = 3) -> str:
    """
    質問テキストから埋め込みを生成し、ベクトルDBから上位 N 件の関連文書を検索する。
    エラー発生時はログを出力し、空文字列を返す。
    """
    try:
        vector_db = load_vector_db()
        if not vector_db:
            logger.warning("Vector DB is empty.")
            return ""
        
        logger.info(f"Generating embedding for query: {question}")
        query_embedding = generate_embedding(question)
        logger.info(f"Search ->")
        results = search_vector_db(query_embedding, vector_db, top_n)
        context = "\n".join([f"・{entry['document']}" for entry in results])
        
        return context
    except Exception as e:
        logger.error(f"Error in retrieve_context: {str(e)}")
        return ""
