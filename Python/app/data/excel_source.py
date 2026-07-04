from pathlib import Path

import pandas as pd

from app.data.base import DataSource, Document


def _normalize_columns(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]
    return df.dropna(how="all")


def _row_to_text(row: pd.Series) -> str:
    parts: list[str] = []
    for col, value in row.items():
        if pd.isna(value):
            continue
        text = str(value).strip()
        if text:
            parts.append(f"{col}: {text}")
    return " | ".join(parts)


class ExcelDataSource(DataSource):
    def __init__(self, file_path: Path, sheet_name: str | None = None):
        self.file_path = file_path
        self.sheet_name = sheet_name

    def load(self) -> list[Document]:
        if not self.file_path.exists():
            raise FileNotFoundError(f"Excel file not found: {self.file_path}")

        df = pd.read_excel(self.file_path, sheet_name=self.sheet_name or 0)
        df = _normalize_columns(df)
        if df.empty:
            return []

        sheet_label = self.sheet_name or self.file_path.stem
        documents: list[Document] = []

        for index, row in df.iterrows():
            content = _row_to_text(row)
            if not content:
                continue
            row_num = int(index) + 2  # header is row 1
            documents.append(
                Document(
                    id=f"excel-{sheet_label}-{row_num}",
                    content=content,
                    metadata={
                        "source": "excel",
                        "file": self.file_path.name,
                        "sheet": str(sheet_label),
                        "row": str(row_num),
                    },
                )
            )
        return documents
