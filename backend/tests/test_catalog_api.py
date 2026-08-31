"""The make and model reference, over HTTP.

Both endpoints are public: the feed filter and the wizard's second step need the list
before anyone has signed in. What they must not do is let a model out from under the
wrong make — `Focus` exists at three manufacturers, and a model picked from the wrong one
is a listing filed under a car it is not.
"""

import uuid


def _brands(client):
    response = client.get("/api/v1/catalog/brands")
    assert response.status_code == 200, response.text
    return response.json()


def test_should_list_the_makes_to_a_caller_who_has_not_signed_in(client):
    brands = _brands(client)

    assert brands, "the catalogue is empty; run python -m app.data.seed_catalog"
    assert {"brand_id", "slug", "name_ru"} <= set(brands[0])


def test_should_give_every_make_a_distinct_slug(client):
    slugs = [brand["slug"] for brand in _brands(client)]

    assert len(slugs) == len(set(slugs))


def test_should_list_the_models_of_a_make_and_only_those(client):
    brands = _brands(client)
    first, second = brands[0], brands[1]

    models = client.get(f"/api/v1/catalog/brands/{first['brand_id']}/models")

    assert models.status_code == 200, models.text
    assert all(model["brand_id"] == first["brand_id"] for model in models.json())
    other = client.get(f"/api/v1/catalog/brands/{second['brand_id']}/models").json()
    assert {model["model_id"] for model in models.json()}.isdisjoint(
        {model["model_id"] for model in other}
    )


def test_should_report_a_make_that_does_not_exist(client):
    response = client.get(f"/api/v1/catalog/brands/{uuid.uuid4()}/models")

    assert response.status_code == 404, response.text
    assert response.json()["code"] == "BRAND_NOT_FOUND"


def test_should_refuse_an_identifier_that_is_not_one(client):
    response = client.get("/api/v1/catalog/brands/not-a-uuid/models")

    assert response.status_code == 422, response.text
