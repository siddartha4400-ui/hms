class TimestampedRepresentationMixin:
    def serialize_timestamps(self) -> dict[str, str | None]:
        return {
            "created_at": self.created_at.isoformat() if getattr(self, "created_at", None) else None,
            "updated_at": self.updated_at.isoformat() if getattr(self, "updated_at", None) else None,
        }