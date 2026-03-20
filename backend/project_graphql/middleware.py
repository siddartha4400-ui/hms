class RequestContextMiddleware:
    def resolve(self, next_, root, info, **kwargs):
        return next_(root, info, **kwargs)