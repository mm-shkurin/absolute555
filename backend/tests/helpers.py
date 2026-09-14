import uuid

from tests.conftest import run_sql, user_id_of


def grant_role(headers: dict, role: str) -> dict:
    run_sql("UPDATE users SET role = :role WHERE id = :id", {"role": role, "id": uuid.UUID(user_id_of(headers))})
    return headers


def get_listing(client, headers, listing_id):
    response = client.get(f"/api/v1/sale_car/{listing_id}", headers=headers)
    assert response.status_code == 200, response.text
    return response.json()


def sale_car_ids(page):
    return [row["sale_car_id"] for row in page["items"]]
