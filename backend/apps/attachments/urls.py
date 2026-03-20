from django.urls import path

from apps.attachments.views import AttachmentUploadView


urlpatterns = [
    path("upload/", AttachmentUploadView.as_view(), name="attachment-upload"),
]