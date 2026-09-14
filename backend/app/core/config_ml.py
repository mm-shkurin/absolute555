"""Настройки распознавания: чем читается СТС и у кого спрашивают.

Отделено от `core/config.py`, когда тот перешагнул лимит в 200 строк. Граница не
выдумана под разрез: это единственные настройки, которые читает только слой `app/ml`,
и меняются они вместе с ним, а не вместе с приложением.
"""

from typing import Optional, Union

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
    gauge_cache_ttl_seconds: int = Field(default=3600, gt=0, alias="GAUGE_CACHE_TTL_SECONDS")
    # Пиксели по длинной стороне: больше — снимок телефона держит сотню мегабайт на воркер,
    # меньше минимума — tesseract не различает символы.
    sts_max_processing_px: int = Field(default=2500, gt=0, alias="STS_MAX_PROCESSING_PX")
    sts_max_ocr_px: int = Field(default=2000, gt=0, alias="STS_MAX_OCR_PX")
    sts_min_px: int = Field(default=800, gt=0, alias="STS_MIN_PX")

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
    # Seconds. Reading a СТС answers slowest: the model reads a whole document.
    giga_token_timeout: int = Field(default=30, gt=0, alias="GIGA_TOKEN_TIMEOUT")
    giga_sts_upload_timeout: int = Field(default=90, gt=0, alias="GIGA_STS_UPLOAD_TIMEOUT")
    giga_sts_answer_timeout: int = Field(default=180, gt=0, alias="GIGA_STS_ANSWER_TIMEOUT")
    giga_gauge_timeout: int = Field(default=60, gt=0, alias="GIGA_GAUGE_TIMEOUT")
    giga_vin_timeout: int = Field(default=120, gt=0, alias="GIGA_VIN_TIMEOUT")
    # GigaChat's certificate chains to the Russian Trusted Root CA, which system trust
    # stores lack. Point this at that bundle; unset means the system store.
    giga_ca_bundle: Optional[str] = Field(default=None, alias="GIGA_CA_BUNDLE")

    @property
    def tls_verify(self) -> Union[str, bool]:
        return self.giga_ca_bundle or True


    model_config = BaseConfig.model_config
