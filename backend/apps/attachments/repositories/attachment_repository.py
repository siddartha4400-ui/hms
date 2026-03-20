from apps.attachments.models import Attachment


def create_attachment(**payload) -> Attachment:
    return Attachment.objects.create(**payload)