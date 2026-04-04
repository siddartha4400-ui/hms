from io import BytesIO
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError
from django.core.files.uploadedfile import InMemoryUploadedFile, UploadedFile

from apps.attachments.repositories.attachment_repository import create_attachment


MAX_IMAGE_DIMENSION = 1600
JPEG_QUALITY = 76
WEBP_QUALITY = 76


def _should_optimize_image(file: UploadedFile) -> bool:
    mime_type = (getattr(file, "content_type", "") or "").lower()
    if not mime_type.startswith("image/"):
        return False
    if mime_type in {"image/svg+xml", "image/gif"}:
        return False
    return True


def _get_resample_filter():
    resampling = getattr(Image, "Resampling", None)
    return resampling.LANCZOS if resampling else Image.LANCZOS


def _optimize_image_upload(file: UploadedFile) -> UploadedFile:
    if not _should_optimize_image(file):
        return file

    try:
        file.seek(0)
        image = Image.open(file)
        image = ImageOps.exif_transpose(image)
        image.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), _get_resample_filter())

        has_alpha = image.mode in {"RGBA", "LA"} or (image.mode == "P" and "transparency" in image.info)
        if not has_alpha and image.mode not in {"RGB", "L"}:
            image = image.convert("RGB")

        output = BytesIO()
        if has_alpha:
            image.save(output, format="WEBP", quality=WEBP_QUALITY, method=6)
            content_type = "image/webp"
            extension = ".webp"
        else:
            image.save(output, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            content_type = "image/jpeg"
            extension = ".jpg"

        optimized_size = output.tell()
        original_size = getattr(file, "size", 0) or 0
        if original_size and optimized_size >= int(original_size * 0.98):
            file.seek(0)
            return file

        output.seek(0)
        optimized_name = f"{Path(file.name).stem}{extension}"
        return InMemoryUploadedFile(
            output,
            field_name=getattr(file, "field_name", "file"),
            name=optimized_name,
            content_type=content_type,
            size=optimized_size,
            charset=None,
        )
    except (UnidentifiedImageError, OSError, ValueError):
        file.seek(0)
        return file


def upload_attachment(*, file: UploadedFile, entity_type: str, entity_id: int, hms_id: int, uploaded_by: int | None = None):
    processed_file = _optimize_image_upload(file)
    return create_attachment(
        file=processed_file,
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