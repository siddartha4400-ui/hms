from dataclasses import dataclass


@dataclass(slots=True)
class Pagination:
    page: int = 1
    page_size: int = 20