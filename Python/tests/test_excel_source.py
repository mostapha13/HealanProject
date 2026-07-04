from pathlib import Path

import pandas as pd
import pytest

from app.data.excel_source import ExcelDataSource


@pytest.fixture
def sample_xlsx(tmp_path: Path) -> Path:
    path = tmp_path / "test.xlsx"
    pd.DataFrame(
        [
            {"نام": "دکتر تست", "تخصص": "عمومی", "تلفن": "021-11111111"},
            {"نام": "دکتر دوم", "تخصص": "قلب", "تلفن": "021-22222222"},
        ]
    ).to_excel(path, index=False)
    return path


def test_excel_load_returns_documents(sample_xlsx: Path):
    source = ExcelDataSource(sample_xlsx)
    docs = source.load()
    assert len(docs) == 2
    assert "دکتر تست" in docs[0].content
    assert docs[0].metadata["source"] == "excel"
