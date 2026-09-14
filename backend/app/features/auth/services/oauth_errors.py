from app.core.exceptions import ExternalServiceError


class OAuthFailed(ExternalServiceError):
    """The provider refused, answered with nothing usable, or could not be reached."""

    default_code = "OAUTH_FAILED"
