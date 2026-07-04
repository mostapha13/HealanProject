from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class Document:
    """یک سند قابل ایندکس — هر ردیف اکسل یا هر رکورد دیتابیس."""

    id: str
    content: str
    metadata: dict[str, str] = field(default_factory=dict)


class DataSource(ABC):
    """قرارداد منبع داده — اکسل الان، SQL Server بعداً."""

    @abstractmethod
    def load(self) -> list[Document]:
        raise NotImplementedError
