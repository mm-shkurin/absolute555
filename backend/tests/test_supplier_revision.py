"""Правка опубликованной витрины: уходит на проверку, витрина до решения — прежняя."""

from tests.test_supplier_profile import (  # noqa: F401
    COMPLETE,
    _id_of,
    decide,
    fill,
    importer,
    send_to_queue,
)


class TestPublishedRevision:
    """Правка опубликованной витрины уходит на проверку, а витрина до решения — прежняя."""

    def _publish(self, client, importer, moderator):
        assert send_to_queue(client, importer).status_code == 200
        assert decide(client, moderator, importer, "approve").status_code == 200

    def test_should_keep_the_published_text_while_the_edit_waits(self, client, importer, moderator):
        self._publish(client, importer, moderator)

        edited = fill(client, importer, terms="Предоплата 10%")
        assert edited.status_code == 200, edited.text
        assert edited.json()["status"] == "published"
        assert edited.json()["revision_status"] == "draft"
        assert edited.json()["pending_changes"]["terms"] == "Предоплата 10%"
        assert client.post("/api/v1/supplier/me/submit", headers=importer).status_code == 200

        public = client.get(f"/api/v1/supplier/{_id_of(importer)}").json()
        assert public["terms"] == COMPLETE["terms"]
        # Неодобренная правка наружу не едет.
        assert "pending_changes" not in public
        waiting = client.get("/api/v1/moderation/suppliers", headers=moderator).json()["items"]
        assert _id_of(importer) in {one["user_id"] for one in waiting}

    def test_should_apply_the_edit_on_approval(self, client, importer, moderator):
        self._publish(client, importer, moderator)
        fill(client, importer, terms="Предоплата 10%")
        client.post("/api/v1/supplier/me/submit", headers=importer)

        assert decide(client, moderator, importer, "approve").status_code == 200

        public = client.get(f"/api/v1/supplier/{_id_of(importer)}").json()
        assert public["terms"] == "Предоплата 10%"
        mine = client.get("/api/v1/supplier/me", headers=importer).json()
        assert mine["revision_status"] is None and mine["pending_changes"] is None

    def test_should_keep_the_storefront_when_the_edit_is_rejected(self, client, importer, moderator):
        self._publish(client, importer, moderator)
        fill(client, importer, terms="Предоплата 10%")
        client.post("/api/v1/supplier/me/submit", headers=importer)

        rejected = decide(client, moderator, importer, "reject", reason="Уточните условия")

        assert rejected.status_code == 200, rejected.text
        assert rejected.json()["status"] == "published"
        assert rejected.json()["revision_status"] == "rejected"
        public = client.get(f"/api/v1/supplier/{_id_of(importer)}")
        assert public.status_code == 200 and public.json()["terms"] == COMPLETE["terms"]

    def test_should_freeze_an_edit_while_it_waits(self, client, importer, moderator):
        self._publish(client, importer, moderator)
        fill(client, importer, terms="Предоплата 10%")
        client.post("/api/v1/supplier/me/submit", headers=importer)

        frozen = fill(client, importer, terms="Ещё раз")

        assert frozen.status_code == 409, frozen.text
        assert frozen.json()["code"] == "PROFILE_FROZEN"
