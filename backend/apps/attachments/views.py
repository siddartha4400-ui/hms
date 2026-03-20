import json

from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from apps.attachments.services import serialize_attachment, upload_attachment
from apps.attachments.validators import validate_attachment_payload
from common.exceptions.api_exception import ApiException


@method_decorator(csrf_exempt, name="dispatch")
class AttachmentUploadView(View):
    http_method_names = ["post"]

    def post(self, request, *args, **kwargs):
        try:
            files = request.FILES.getlist("files") or ([request.FILES.get("file")] if request.FILES.get("file") else [])
            if not files:
                raise ApiException("file is required.")

            entity_type = request.POST.get("entity_type")
            entity_id = request.POST.get("entity_id")
            hms_id = request.POST.get("hms_id")
            uploaded_by_value = request.POST.get("uploaded_by")
            uploaded_by = int(uploaded_by_value) if uploaded_by_value else getattr(request.user, "id", None)

            attachments = []
            for file in files:
                payload = validate_attachment_payload(
                    file=file,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    hms_id=hms_id,
                )
                attachment = upload_attachment(file=file, uploaded_by=uploaded_by, **payload)
                attachments.append(serialize_attachment(attachment))

            return JsonResponse({"attachments": attachments}, status=201)
        except ApiException as exc:
            return JsonResponse({"error": exc.message}, status=exc.status_code)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid request payload."}, status=400)