from django.urls import path

from apps.attachments.views import AttachmentDeleteView, AttachmentListView, AttachmentUploadView


urlpatterns = [
    path("", AttachmentListView.as_view(), name="attachment-list"),
    path("upload/", AttachmentUploadView.as_view(), name="attachment-upload"),
    path("<int:attachment_id>/", AttachmentDeleteView.as_view(), name="attachment-delete"),
]