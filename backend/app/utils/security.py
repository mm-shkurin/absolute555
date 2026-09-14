from datetime import datetime, timedelta

from fastapi.security import APIKeyHeader
import jwt
from app.core.exceptions import AuthenticationError
from app.core.config_getters import get_jwt_settings

auth_scheme = APIKeyHeader(name="Authorization", scheme_name="Bearer", auto_error=False)

async def create_access_token(to_encode: dict):
    expire = datetime.utcnow() + timedelta(
        minutes=get_jwt_settings().access_token_expire_minutes
    )
    payload = dict(to_encode)
    payload.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(
        payload, get_jwt_settings().secret_key, algorithm=get_jwt_settings().algorithm
    )

    return encoded_jwt

async def create_refresh_token(to_encode: dict):
    expire = datetime.utcnow() + timedelta(
        minutes=get_jwt_settings().refresh_token_expire_minutes
    )
    payload = dict(to_encode)
    payload.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(
        payload, get_jwt_settings().refresh_token_secret_key, algorithm=get_jwt_settings().algorithm
    )

    return encoded_jwt

async def verify_token(token:str, secret_key:str, algorithm:str):
    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired", code="TOKEN_EXPIRED") from None
    except jwt.InvalidTokenError:
        raise AuthenticationError("Could not validate credentials", code="TOKEN_INVALID") from None
