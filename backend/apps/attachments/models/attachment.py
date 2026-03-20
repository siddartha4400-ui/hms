import uuid
from pathlib import Path

from django.db import models
from django.utils.text import slugify

from core.base_model import BaseModel


def attachment_upload_to(instance: "Attachment", filename: str) -> str:
    original_name = Path(filename).name
    safe_stem = slugify(Path(original_name).stem) or "file"
    extension = Path(original_name).suffix.lower()

    if not instance.storage_folder:
        instance.storage_folder = uuid.uuid4().hex

    instance.original_filename = original_name
    instance.saved_filename = f"{safe_stem}{extension}"

    entity_type = slugify(instance.entity_type or "generic") or "generic"
    entity_id = instance.entity_id or 0
    return f"attachments/{entity_type}/{entity_id}/{instance.storage_folder}/{instance.saved_filename}"


class Attachment(BaseModel):
    entity_type = models.CharField(max_length=100)
    entity_id = models.BigIntegerField(db_index=True)
    file_path = models.TextField(blank=True)
    file_size = models.BigIntegerField(default=0)
    mime_type = models.CharField(max_length=150, blank=True)
    uploaded_by = models.BigIntegerField(null=True, blank=True)
    storage_folder = models.CharField(max_length=64, editable=False, blank=True)
    original_filename = models.CharField(max_length=255, editable=False, blank=True)
    saved_filename = models.CharField(max_length=255, editable=False, blank=True)
    file = models.FileField(upload_to=attachment_upload_to)

    class Meta:
        db_table = "attachments"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size or 0
            self.mime_type = getattr(self.file.file, "content_type", self.mime_type) or self.mime_type
        super().save(*args, **kwargs)
        if self.file and self.file_path != self.file.name:
            self.file_path = self.file.name
            super().save(update_fields=["file_path", "updated_at"])

    @property
    def file_url(self) -> str:
        return self.file.url if self.file else ""