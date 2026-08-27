import pytest
from fastapi.testclient import TestClient

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
