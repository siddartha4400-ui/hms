from django.conf import settings
from django.http import JsonResponse

from apps.subsites.models import HMS


def _extract_host_without_port(request) -> str:
    raw_host = (request.META.get("HTTP_X_FORWARDED_HOST") or request.META.get("HTTP_HOST") or "").strip().lower()
    if not raw_host:
        return ""
    return raw_host.split(":", 1)[0]


def _get_subsite_key_from_host(host: str, base_domain: str, backend_host: str) -> str | None:
    if not host:
        return None

    normalized_host = host.lower()
    normalized_base_domain = (base_domain or "").lower().strip()
    normalized_backend_host = (backend_host or "").lower().strip()

    if normalized_host in {"localhost", "127.0.0.1", normalized_backend_host, normalized_base_domain}:
        return None

    suffix = f".{normalized_base_domain}"
    if not normalized_base_domain or not normalized_host.endswith(suffix):
        return None

    # Example: alpha.hms.local -> alpha
    left_part = normalized_host[: -len(suffix)]
    if not left_part:
        return None

    subsite_key = left_part.split(".")[0].strip()
    if subsite_key in {"backend", "www"}:
        return None
    return subsite_key or None


class SubsiteContextMiddleware:
    """Attach subsite context from host for every request and block unknown subsites."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.subsite_key = None
        request.subsite = None
        request.company_id = None
        request.user_id = None

        host = _extract_host_without_port(request)
        subsite_key = _get_subsite_key_from_host(
            host=host,
            base_domain=getattr(settings, "SUBSITE_BASE_DOMAIN", "hms.local"),
            backend_host=getattr(settings, "BACKEND_BASE_HOST", "backend.hms.local"),
        )

        request.subsite_key = subsite_key

        if subsite_key:
            subsite = HMS.objects.filter(hms_name=subsite_key, is_active=True).only("id", "hms_name").first()
            if not subsite:
                return JsonResponse(
                    {
                        "success": False,
                        "message": "Site is not available",
                        "subsite_key": subsite_key,
                    },
                    status=404,
                )

            request.subsite = subsite
            request.company_id = subsite.id

        user = getattr(request, "user", None)
        if user and user.is_authenticated:
            request.user_id = user.id

        return self.get_response(request)


class RequestContextMiddleware:
    def resolve(self, next_, root, info, **kwargs):
        request = info.context
        user = getattr(request, "user", None)

        request.user_id = user.id if user and user.is_authenticated else None

        if getattr(request, "company_id", None) is None:
            profile = getattr(user, "profile", None) if user and user.is_authenticated else None
            profile_company_id = getattr(profile, "company_id", None) if profile else None
            request.company_id = profile_company_id

        return next_(root, info, **kwargs)