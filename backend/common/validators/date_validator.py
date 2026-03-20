from datetime import date


def is_past_or_today(value: date) -> bool:
    return value <= date.today()