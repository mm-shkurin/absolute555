"""Словарь состояний предложения: шесть исходов и то, какие из них ещё живы.

Отдельно от ORM по той же причине, что и у объявления: набор статусов нужен роутеру и
схеме, а таблица — только сервису.
"""

from enum import Enum as PyEnum


class OfferStatus(str, PyEnum):
    """Six outcomes, because six different things happen.

    The screen writes "withdrawn by you", "expired" and "the car was sold" in different
    words: one the buyer did, one nobody did, one the seller did with somebody else. A
    single "rejected" would tell a buyer they were turned down when they were not.
    """

    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    EXPIRED = "expired"
    CAR_SOLD = "car_sold"


# What may still be answered, withdrawn or expired. Everything else is settled.
LIVE = frozenset({OfferStatus.PENDING})
