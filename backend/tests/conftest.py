import asyncio
import itertools
import uuid

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.db.database import get_db_session
from app.main import app


@pytest.fixture(scope="session")
def client() -> TestClient:
    """A client over the real application object.

    Importing app.main is itself part of what these tests assert: every router under
    api_router is imported at module level, so a broken import in any of them fails
    collection rather than one test. That is deliberate — the whole router tree went
    unexecuted for the life of the project because nothing mounted it.

    No database is started for these tests. They cover routing and auth boundaries only:
    which paths exist, and which of them refuse an anonymous caller before touching
    storage. Tests that need real rows belong in an acceptance suite against the running
    stack (see .claude/templates/tdd/README.md).
    """
    return TestClient(app)


@pytest.fixture
def signed_in(client):
    """A factory for signed-in callers, each a distinct user.

    Guest login is the cheapest real account this API offers: one call, no provider, and
    it yields an ordinary user row. Tests that need two parties call the factory twice.
    """
    counter = itertools.count()

    def _sign_in() -> dict:
        device_id = f"test-device-{uuid.uuid4()}-{next(counter)}"
        response = client.post("/api/v1/auth/guest/login", json={"device_id": device_id})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    return _sign_in


@pytest.fixture
def moderator(client, signed_in):
    """A caller who may approve and reject.

    The role is granted straight in the database: this project has no endpoint that
    promotes a user, and story 13 is where role requests are built. Setup reaches for
    the row; every assertion still goes over HTTP.
    """
    headers = signed_in()
    token = headers["Authorization"].removeprefix("Bearer ")
    user_id = jwt.decode(token, options={"verify_signature": False})["id"]

    async def _promote():
        async with get_db_session() as session:
            await session.execute(
                text("UPDATE users SET role = 'manager' WHERE id = :id"),
                {"id": uuid.UUID(user_id)},
            )
            await session.commit()

    asyncio.run(_promote())
    return headers


@pytest.fixture
def seller(signed_in):
    return signed_in()


@pytest.fixture(scope="session")
def catalogue(client) -> tuple:
    """A make and a model that exist, as ids.

    Completeness needs both resolved against the catalogue (story 3), so every test that
    reaches moderation needs a real pair rather than an invented uuid.
    """
    brands = client.get("/api/v1/catalog/brands")
    assert brands.status_code == 200, brands.text
    assert brands.json(), "the catalogue is empty; run the seeder before this suite"
    brand_id = brands.json()[0]["brand_id"]

    models = client.get(f"/api/v1/catalog/brands/{brand_id}/models")
    assert models.status_code == 200, models.text
    assert models.json(), f"brand {brand_id} has no models"
    return brand_id, models.json()[0]["model_id"]


# A one-pixel PNG. The gate asks whether a photo exists, not what it shows.
PIXEL_PNG = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQ"
    "AAAABJRU5ErkJggg=="
)


@pytest.fixture
def attach_photo(client):
    """Give a listing one photo, through the API the seller uses."""

    def _attach(listing_id: str, headers: dict, image_b64: str = PIXEL_PNG):
        response = client.post(
            f"/api/v1/sale_car/{listing_id}/photos",
            headers=headers,
            json={"photos_b64": [image_b64]},
        )
        assert response.status_code == 200, response.text
        assert response.json()["s3_photo_car_keys"], "the gallery is still empty"
        return response.json()["s3_photo_car_keys"]

    return _attach
