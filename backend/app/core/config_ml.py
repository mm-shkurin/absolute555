"""Настройки распознавания: чем читается СТС и у кого спрашивают.

Отделено от `core/config.py`, когда тот перешагнул лимит в 200 строк. Граница не
выдумана под разрез: это единственные настройки, которые читает только слой `app/ml`,
и меняются они вместе с ним, а не вместе с приложением.
"""

from pydantic import Field, HttpUrl
from pydantic_settings import BaseSettings

from app.core.config import BaseConfig


class RecognitionSettings(BaseSettings):
    """Чем читается СТС.

    Второе мнение по номеру выключено: на двенадцати настоящих свидетельствах оно
    пригодилось один раз, один раз подсунуло номер ПТС вместо номера машины, а к каждому
    документу добавляло 20-58 секунд поверх 7-18 у зрения. Настройка оставлена, потому
    что на чистых сканах соотношение обратное.
    """

    confirm_number_with_ocr: bool = Field(False, alias="CONFIRM_NUMBER_WITH_OCR")

    model_config = BaseConfig.model_config


class OllamaSettings(BaseSettings):
    ollama_url: HttpUrl = Field(..., alias="OLLAMA_URL")
    ollama_model_name: str = Field(..., min_length=1, alias="OLLAMA_MODEL_NAME")
    
    model_config = BaseConfig.model_config

class GigaChatSettings(BaseSettings):
    giga_auth_key: str = Field(..., min_length=1, alias="GIGA_AUTH_KEY")
    giga_client_id: str = Field(..., min_length=1, alias="GIGA_CLIENT_ID")
    giga_scope: str = Field(default="GIGACHAT_API_PERS", alias="GIGA_SCOPE")
    giga_oauth_url: HttpUrl = Field(..., alias="GIGA_OAUTH_URL")
    giga_api_url: HttpUrl = Field(..., alias="GIGA_API_URL")
    
    model_config = BaseConfig.model_config
