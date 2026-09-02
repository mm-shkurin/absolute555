"""Anonymous callers are refused before anything touches storage.

These endpoints all depend on get_current_user. With no database running, a request that
reaches a service raises instead of answering 401 — so a 500 here means the auth
dependency did not fire, which is the failure worth catching.
"""

import pytest

PROTECTED = [
    ("GET", "/api/v1/user/profile"),
    ("GET", "/api/v1/sale_car/user"),
    ("PATCH", "/api/v1/sale_car/00000000-0000-0000-0000-000000000000"),
    ("DELETE", "/api/v1/sale_car/00000000-0000-0000-0000-000000000000"),
    ("GET", "/api/v1/offer/my"),
    ("POST", "/api/v1/offer/"),
]


@pytest.mark.parametrize("method,path", PROTECTED)
def test_should_refuse_an_anonymous_caller(client, method, path):
    response = client.request(method, path, json={})
    assert response.status_code in (401, 403), (
        f"{method} {path} answered {response.status_code}; an unauthenticated caller "
        "must be refused by the dependency, not by whatever fails deeper in"
    )


def test_should_leave_the_public_feed_open(client):
    # The listing feed is deliberately readable by a guest — flow 1 in
    # ProductSpecification/UserFlows.md. It needs a database, so this asserts only that
    # it is not the auth layer that stops an anonymous caller.
    response = client.get("/api/v1/sale_car/list")
    assert response.status_code not in (401, 403)
