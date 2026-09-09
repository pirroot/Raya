class BaseService:
    """
    Base class for the service layer.
    Views/ViewSets stay thin (validate input via serializer, call a service,
    return the result) — all business logic belongs in services like this one.
    """

    def __init__(self, user=None):
        self.user = user
