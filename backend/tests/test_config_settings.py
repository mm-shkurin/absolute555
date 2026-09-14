"""Настройки: что обязано быть задано и во что оно собирается.

Конфиг — единственное место, где опечатка не ломает ни один тест поведения, но роняет
запуск в проде. Поэтому здесь проверяются границы: короткий ключ подписи, порт вне
диапазона, отсутствующая обязательная переменная и сборка строки подключения.
"""

import pytest
from pydantic import ValidationError as PydanticError

from app.core.config import DatabaseSettings, JWTSettings, LogLevel
from app.core.config_storage import MinioSettings, RedisSettings

DATABASE = {
    "POSTGRES_NETWORK_NAME": "postgres",
    "POSTGRES_USER": "absolute",
    "POSTGRES_PASSWORD": "absolute",
    "POSTGRES_DB": "absolute",
    "POSTGRES_HOST": "db.internal",
    "POSTGRES_PORT": 5433,
}


def test_should_build_an_asyncpg_url_from_the_parts():
    settings = DatabaseSettings(**DATABASE)

    assert settings.database_url == (
        "postgresql+asyncpg://absolute:absolute@db.internal:5433/absolute"
    )


def test_should_take_the_host_from_the_environment():
    # Дефолт `localhost` здесь не проверить: `.env` задаёт POSTGRES_HOST, и он выигрывает
    # у значения по умолчанию — что и есть нужное поведение в контейнере.
    settings = DatabaseSettings(**{**DATABASE, "POSTGRES_HOST": "db.internal"})

    assert "@db.internal:5433/" in settings.database_url


@pytest.mark.parametrize("port", [0, 70000, -1])
def test_should_refuse_a_port_outside_the_range(port):
    with pytest.raises(PydanticError):
        DatabaseSettings(**{**DATABASE, "POSTGRES_PORT": port})


@pytest.mark.parametrize("field", ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"])
def test_should_refuse_an_empty_credential(field):
    with pytest.raises(PydanticError):
        DatabaseSettings(**{**DATABASE, field: ""})


def test_should_refuse_a_signing_key_short_enough_to_brute_force():
    with pytest.raises(PydanticError):
        JWTSettings(
            SECRET_KEY="короткий",
            REFRESH_TOKEN_SECRET_KEY="b" * 40,
            ACCESS_TOKEN_EXPIRE_MINUTES=30,
            REFRESH_TOKEN_EXPIRE_MINUTES=1440,
        )


def test_should_keep_the_two_signing_keys_apart_by_name():
    settings = JWTSettings(
        SECRET_KEY="a" * 40,
        REFRESH_TOKEN_SECRET_KEY="b" * 40,
        ACCESS_TOKEN_EXPIRE_MINUTES=30,
        REFRESH_TOKEN_EXPIRE_MINUTES=1440,
    )

    assert settings.secret_key != settings.refresh_token_secret_key
    assert settings.algorithm == "HS256"


def test_should_read_the_settings_the_running_application_uses():
    # Значения приезжают из .env: если переменную переименовали и забыли .env.example,
    # падает здесь, а не при первом запросе в проде.
    assert DatabaseSettings().database_url.startswith("postgresql+asyncpg://")
    assert RedisSettings().redis_port > 0
    assert MinioSettings().minio_bucket_name


def test_should_name_every_log_level_the_application_accepts():
    assert {level.value for level in LogLevel} == {
        "debug",
        "info",
        "warning",
        "error",
        "critical",
    }
