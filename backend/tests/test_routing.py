"""The API is reachable at all.

Every domain router was assembled into api_router and never mounted, so for the life of
the project the application served three paths: /, /health and the docs. These tests hold
that door open — they fail if a router is dropped from api_router, if the /api/v1 prefix
moves, or if a router stops importing.
"""

import pytest

# One representative path per router, with the method it answers. Not the whole route
# table: the point is that each router is mounted, and a full inventory here would need
# editing on every new endpoint without catching anything the sample misses.
MOUNTED_ROUTES = [
    ("GET", "/api/v1/auth/yandex/login"),
    ("POST", "/api/v1/auth/guest/login"),
    ("GET", "/api/v1/user/profile"),
    ("POST", "/api/v1/photos/sale-car/sts"),
    ("GET", "/api/v1/role/users"),
    ("GET", "/api/v1/task/sse/{sale_car_id}"),
    ("GET", "/api/v1/sale_car/list"),
    ("POST", "/api/v1/offer/"),
]


def _route_table(client):
    table = {}
    for route in client.app.routes:
        methods = getattr(route, "methods", None)
        if methods:
            table.setdefault(route.path, set()).update(methods)
    return table


@pytest.mark.parametrize("method,path", MOUNTED_ROUTES)
def test_should_mount_every_domain_router_under_api_v1(client, method, path):
    table = _route_table(client)
    assert path in table, f"{path} is not registered; is its router missing from api_router?"
    assert method in table[path]


def test_should_serve_health_outside_the_api_prefix(client):
    # The container's HEALTHCHECK probes this path literally. Moving it under /api/v1
    # would make the backend report unhealthy while serving every request correctly.
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_should_not_register_auth_routes_twice(client):
    # auth was mounted directly at /auth as well as inside api_router. Mounting both
    # left every auth route on two paths, which is how an OAuth callback ends up
    # registered at an address the provider was never told about.
    duplicated = [path for path in _route_table(client) if path.startswith("/auth/")]
    assert duplicated == []
