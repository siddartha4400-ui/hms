from pathlib import Path


def get_filename_parts(file_name: str) -> tuple[str, str]:
    path = Path(file_name)
    return path.stem, path.suffix.lower()