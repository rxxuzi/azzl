# pull.py
import sys
import os
from gen.database import load_documents, save_vector_db
from gen.vector import generate_embedding, setup_chroma_collection

def create_vector_db():
    collection = setup_chroma_collection()  # ChromaDBのセットアップ
    documents = load_documents()
    vector_db = []
    
    for i, doc in enumerate(documents):
        embedding = generate_embedding(doc)  # 埋め込み生成のみ
        vector_db.append({
            "id": str(i),
            "embedding": embedding,
            "document": doc
        })
        # ChromaDBへの追加
        collection.add(
            ids=[str(i)],
            embeddings=[embedding],
            documents=[doc]
        )
    
    save_vector_db(vector_db)
    print("ベクトルDB作成完了")

if __name__ == "__main__":
    create_vector_db()
