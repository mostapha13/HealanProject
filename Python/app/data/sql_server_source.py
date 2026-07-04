from app.data.base import DataSource, Document


class SqlServerDataSource(DataSource):
    """
  منبع داده SQL Server — برای فاز بعدی.

  نصب: pip install pyodbc sqlalchemy
  مثال query:
    SELECT Id, FullName, Specialty, Phone, Address FROM Doctors
    """

    def __init__(self, connection_string: str, query: str):
        self.connection_string = connection_string
        self.query = query

    def load(self) -> list[Document]:
        if not self.connection_string.strip() or not self.query.strip():
            raise ValueError(
                "SQL Server is not configured. Set SQL_SERVER_CONNECTION_STRING "
                "and SQL_SERVER_QUERY in .env, or use DATA_SOURCE=excel."
            )

        try:
            import pandas as pd
            from sqlalchemy import create_engine
        except ImportError as exc:
            raise ImportError(
                "Install pyodbc and sqlalchemy: pip install pyodbc sqlalchemy"
            ) from exc

        engine = create_engine(self.connection_string)
        df = pd.read_sql(self.query, engine)
        df.columns = [str(c).strip() for c in df.columns]

        documents: list[Document] = []
        for index, row in df.iterrows():
            parts = [
                f"{col}: {row[col]}"
                for col in df.columns
                if row[col] is not None and str(row[col]).strip()
            ]
            if not parts:
                continue
            pk = str(row.get("Id", row.get("id", index)))
            documents.append(
                Document(
                    id=f"sql-{pk}",
                    content=" | ".join(parts),
                    metadata={"source": "sqlserver", "id": pk},
                )
            )
        return documents
