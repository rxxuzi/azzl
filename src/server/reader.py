# reader.py
import os
import tempfile
import logging
from typing import List
from fastapi import HTTPException, UploadFile

# MarkItDown のインポート（ライブラリに合わせて適宜インポート方法を変更してください）
from markitdown import MarkItDown

logger = logging.getLogger(__name__)

# 拡張子の定義（必要に応じて調整）
ALLOWED_EXTENSIONS = {".c", ".py", ".java", ".js", ".cpp", ".go", ".txt", ".md", ".html", ".php", ".tsx",".html", ".csv", ".json", ".xml"}
MARKITDOWN_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx"}

md_converter = MarkItDown()

async def read_uploaded_files(files: List[UploadFile]) -> str:
    """
    アップロードされたファイルを読み込み、各ファイルの内容をまとめた文字列を返す。
    MARKITDOWN_EXTENSIONS に該当するファイルは MarkItDown を使って変換する。
    """
    combined_content = ""

    for file in files:
        filename = file.filename
        ext = os.path.splitext(filename)[1].lower()

        if ext in MARKITDOWN_EXTENSIONS:
            try:
                with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
                    tmp.write(await file.read())
                    tmp_path = tmp.name
                result = md_converter.convert(tmp_path)
                file_text = result.text_content or ""
                combined_content += f"\n\n--- Start of {filename} ---\n{file_text}\n--- End of {filename} ---\n"
                os.remove(tmp_path)
            except Exception as e:
                logger.error(f"Error converting {filename}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error converting {filename}: {str(e)}")
        elif ext in ALLOWED_EXTENSIONS:
            try:
                content = await file.read()
                text = content.decode("utf-8", errors="ignore")
                combined_content += f"\n\n--- Start of {filename} ---\n{text}\n--- End of {filename} ---\n"
            except Exception as e:
                logger.error(f"Error reading {filename}: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error reading {filename}: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail=f"Illegal or unsupported file format: {filename}")

    return combined_content
