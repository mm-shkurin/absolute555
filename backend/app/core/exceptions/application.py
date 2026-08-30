"""Failures of the application's own rules, rather than of the caller's identity."""

from .base import BaseErrorApp


class ValidationError(BaseErrorApp):
    """The request parsed but the values are not usable."""

    default_status = 422
    default_code = "VALIDATION_ERROR"
    default_message = "The request is not valid"


class BusinessRuleError(BaseErrorApp):
    """A rule of the domain refuses this, and no retry will change that."""

    default_status = 409
    default_code = "BUSINESS_RULE_VIOLATED"
    default_message = "This is not allowed here"


class ExternalServiceError(BaseErrorApp):
    """Something the API depends on -- S3, an OAuth provider, GigaChat -- failed.

    502 rather than 500: the fault is upstream, and a retry may well succeed.
    """

    default_status = 502
    default_code = "EXTERNAL_SERVICE_ERROR"
    default_message = "An upstream service is unavailable"
