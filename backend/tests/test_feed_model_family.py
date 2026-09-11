"""Модель в фильтре ленты находит и свои исполнения.

Справочник хранит исполнения отдельными строками («GS», «GS 300», «GS 430»), а
покупатель, выбравший «GS», ищет машину, а не строку справочника.
"""

import pytest

from tests.test_feed import _feed, _ids, publish  # noqa: F401 -- фикстура по имени


def _lexus(client):
    brands = client.get("/api/v1/catalog/brands").json()
    brand = next(one for one in brands if one["slug"] == "lexus")
    models = client.get(f"/api/v1/catalog/brands/{brand['brand_id']}/models").json()
    by_name = {one["name"]: one["model_id"] for one in models}
    return brand["brand_id"], by_name


@pytest.fixture
def catalogue(client):
    """Та же фикстура по имени, что в conftest: `publish` публикует Lexus GS 430."""
    brand_id, models = _lexus(client)
    return brand_id, models["GS 430"]


@pytest.fixture
def gs430(client, publish):
    brand_id, models = _lexus(client)
    return brand_id, models, publish()


def test_should_find_a_trim_when_the_family_is_chosen(client, gs430):
    brand_id, models, listing_id = gs430

    page = _feed(client, brand_id=brand_id, model_id=models["GS"], size=60)

    assert listing_id in _ids(page)


def test_should_not_find_a_sibling_trim(client, gs430):
    brand_id, models, listing_id = gs430

    page = _feed(client, brand_id=brand_id, model_id=models["GS 300"], size=60)

    assert listing_id not in _ids(page)
