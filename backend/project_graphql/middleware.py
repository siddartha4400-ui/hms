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

        # Attach the user's own HMS id so resolvers can use it for scoping.
        # We do NOT override company_id here — that comes only from SubsiteContextMiddleware
        # (host-based) and must stay clean for mutation safety checks.
        profile_hms_id = None
        if user and user.is_authenticated and not getattr(user, "is_superuser", False):
            profile = getattr(user, "profile", None)
            if profile:
                cid = getattr(profile, "company_id", None) or None
                if cid is None:
                    # Fallback for accounts created before company_id was populated
                    hid = getattr(profile, "hms_id", None)
                    cid = hid if hid else None
                try:
                    profile_hms_id = int(cid) if cid is not None else None
                except (TypeError, ValueError):
                    profile_hms_id = None
        request.profile_hms_id = profile_hms_id

        return next_(root, info, **kwargs)