"""Public endpoints of third-party providers: data the settings default to, env overrides."""

import json
from functools import lru_cache
from pathlib import Path
from typing import Callable

_SOURCE = Path(__file__).with_name("provider_endpoints.json")


@lru_cache
def _read(name: str) -> str:
    return json.loads(_SOURCE.read_text(encoding="utf-8"))[name]


def endpoint(name: str) -> Callable[[], str]:
    return lambda: _read(name)
