"""Засев справочника: второй прогон ничего не удваивает.

Задача 5 бэклога. Модуль был покрыт на 0%, а зовут его при каждом развёртывании — и
единственное, что от него требуется сверх наполнения, это чтобы повторный запуск был
безопасным.
"""

import pytest
from sqlalchemy import func, select

from app.data.seed_catalog import seed
from app.db.database import get_db_session, get_engine
from app.features.catalog.models.catalog import Brand, BrandAlias, CarModel


async def _counts() -> tuple[int, int, int]:
    async with get_db_session() as db:
        brands = await db.execute(select(func.count()).select_from(Brand))
        models = await db.execute(select(func.count()).select_from(CarModel))
        aliases = await db.execute(select(func.count()).select_from(BrandAlias))
        return brands.scalar_one(), models.scalar_one(), aliases.scalar_one()


@pytest.fixture
async def app_engine_in_this_loop():
    """Пул приложения, освобождённый до и после теста.

    Засев ходит в базу через общий движок, а asyncpg привязывает соединение к циклу,
    который его открыл. В одиночку тест проходит, в общем прогоне — нет: до него тем же
    движком уже пользовался TestClient из своего цикла. Пул сбрасывается, чтобы
    соединения открылись здесь, и сбрасывается снова, чтобы следующий тест не получил
    соединения этого цикла.
    """
    await get_engine().dispose()
    yield
    await get_engine().dispose()


@pytest.mark.asyncio
async def test_should_not_duplicate_anything_on_a_second_run(app_engine_in_this_loop):
    await seed()
    before = await _counts()

    await seed()
    after = await _counts()

    assert after == before
    assert before[0] > 0, "справочник пуст — засев не дошёл до базы"
