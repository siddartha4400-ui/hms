from django.core.files.uploadedfile import UploadedFile

from apps.attachments.repositories.attachment_repository import create_attachment


def upload_attachment(*, file: UploadedFile, entity_type: str, entity_id: int, hms_id: int, uploaded_by: int | None = None):
    return create_attachment(
        file=file,
        entity_type=entity_type,
        entity_id=entity_id,
        hms_id=hms_id,
        uploaded_by=uploaded_by,
    )


def serialize_attachment(attachment) -> dict[str, int | str | None]:
    return {
        "id": attachment.id,
        "hms_id": attachment.hms_id,
        "entity_type": attachment.entity_type,
        "entity_id": attachment.entity_id,
        "file_path": attachment.file_path,
        "file_size": attachment.file_size,
        "mime_type": attachment.mime_type,
        "uploaded_by": attachment.uploaded_by,
        "created_at": attachment.created_at.isoformat(),
        "updated_at": attachment.updated_at.isoformat(),
        "url": attachment.file_url,
        "folder_name": attachment.storage_folder,
        "file_name": attachment.saved_filename or attachment.original_filename,
        "original_file_name": attachment.original_filename,
    }