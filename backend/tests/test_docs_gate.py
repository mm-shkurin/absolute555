"""Документация закрыта ключом.

Открытая схема — карта площадки для того, кто её изучает перед тем, как ломать: все
пути, все тела запросов и все коды ошибок одним файлом. Проверяется не то, что страница
рисуется, а то, что без ключа она не отдаёт ни схему, ни Swagger.
"""

import pytest

from app.core.config import DocsSettings


@pytest.fixture(scope="module")
def api_key() -> str:
    return DocsSettings().docs_api_key


@pytest.fixture(autouse=True)
def no_session(client):
    """Клиент живёт всю сессию, и кука из соседнего теста делает «без куки» неправдой."""
    client.cookies.clear()
    yield
    client.cookies.clear()


def _sign_in(client, api_key, path="/docs/auth"):
    return client.post(path, data={"api_key": api_key}, follow_redirects=False)


def test_should_show_a_login_page_instead_of_swagger(client):
    page = client.get("/docs", follow_redirects=False)

    assert page.status_code == 200, page.text
    assert "/docs/auth" in page.text


def test_should_refuse_a_wrong_key(client):
    refused = _sign_in(client, "не тот ключ")

    assert refused.status_code == 401, refused.text
    assert "docs_session" not in refused.cookies


def test_should_hand_out_a_session_cookie_for_the_right_key(client, api_key):
    accepted = _sign_in(client, api_key)

    assert accepted.status_code == 302, accepted.text
    assert accepted.headers["location"] == "/docs/swagger"
    assert "docs_session" in accepted.cookies
    assert "httponly" in accepted.headers["set-cookie"].lower()


def test_should_send_an_uninvited_reader_back_to_the_login_page(client):
    swagger = client.get("/docs/swagger", follow_redirects=False)

    assert swagger.status_code == 302, swagger.text
    assert swagger.headers["location"] == "/docs"


def test_should_draw_swagger_for_a_reader_with_a_session(client, api_key):
    token = _sign_in(client, api_key).cookies["docs_session"]

    swagger = client.get("/docs/swagger", cookies={"docs_session": token})

    assert swagger.status_code == 200, swagger.text
    assert "swagger" in swagger.text.lower()


def test_should_refuse_the_schema_without_a_session_or_a_key(client):
    schema = client.get("/openapi.json")

    assert schema.status_code == 401, schema.text
    assert schema.json()["code"] == "DOCS_KEY_INVALID"


def test_should_serve_the_schema_to_a_session(client, api_key):
    token = _sign_in(client, api_key).cookies["docs_session"]

    schema = client.get("/openapi.json", cookies={"docs_session": token})

    assert schema.status_code == 200, schema.text
    assert "/api/v1/sale_car" in schema.json()["paths"]


def test_should_serve_the_schema_to_a_service_holding_the_key(client, api_key):
    schema = client.get("/openapi.json", headers={"X-API-Key": api_key})

    assert schema.status_code == 200, schema.text
    assert schema.json()["paths"]


def test_should_gate_redoc_the_same_way(client, api_key):
    page = client.get("/redoc", follow_redirects=False)
    uninvited = client.get("/redoc/view", follow_redirects=False)
    accepted = _sign_in(client, api_key, path="/redoc/auth")

    assert page.status_code == 200 and "/redoc/auth" in page.text
    assert uninvited.status_code == 302 and uninvited.headers["location"] == "/redoc"
    assert accepted.status_code == 302
    assert accepted.headers["location"] == "/redoc/view"


def test_should_mark_the_session_cookie_secure_and_same_site(client, api_key):
    cookie = _sign_in(client, api_key).headers["set-cookie"].lower()

    assert "secure" in cookie
    assert "samesite=strict" in cookie


def test_should_refuse_a_session_it_never_handed_out(client):
    swagger = client.get(
        "/docs/swagger", cookies={"docs_session": "forged-token"}, follow_redirects=False
    )

    assert swagger.status_code == 302, swagger.text
    assert swagger.headers["location"] == "/docs"
