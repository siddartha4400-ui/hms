from apps.attachments.models import Attachment


def create_attachment(**payload) -> Attachment:
    return Attachment.objects.create(**payload)


def get_attachment_by_id(attachment_id: int) -> Attachment | None:
    return Attachment.objects.filter(id=attachment_id).first()


def delete_attachment_record(attachment: Attachment) -> None:
    attachment.delete()


def list_attachments_by_entity(entity_type: str, entity_id: int, hms_id: int | None = None):
    queryset = Attachment.objects.filter(entity_type=entity_type, entity_id=entity_id)
    if hms_id is not None:
        queryset = queryset.filter(hms_id=hms_id)
    return queryset.order_by("-created_at")