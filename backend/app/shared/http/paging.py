"""The page-size query parameter every paged list accepts."""

from fastapi import Query

DEFAULT_PAGE_SIZE = 20


def page_size(default: int = DEFAULT_PAGE_SIZE, most: int = 60, name: str = "size"):
    """A dependency reading the page size, bounded to 1..`most`, under query name `name`."""

    def dependency(value: int = Query(default, ge=1, le=most, alias=name)) -> int:
        return value

    return dependency
