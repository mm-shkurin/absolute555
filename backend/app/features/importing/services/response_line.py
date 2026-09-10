"""Первая строка переписки, которую открывает отклик поставщика.

Строку пишет сервер, а не поставщик: покупатель должен прочитать цену и срок в том же
виде, в каком они попали в отклик, и правка отклика должна давать ту же строку заново.
"""

from app.features.importing.models.request import SupplierResponse

DAYS = ("день", "дня", "дней")


def _days(count: int) -> str:
    tail = count % 100
    if 11 <= tail <= 14:
        return DAYS[2]
    tail = count % 10
    if tail == 1:
        return DAYS[0]
    if 2 <= tail <= 4:
        return DAYS[1]
    return DAYS[2]


def _money(amount: float) -> str:
    # Неразрывный пробел между разрядами: цена не должна переноситься по строке.
    return f"{int(round(amount)):,}".replace(",", "\u00a0")


def response_line(response: SupplierResponse) -> str:
    line = (
        f"Отклик на заявку: {_money(response.price)} ₽, "
        f"доставка {response.delivery_days} {_days(response.delivery_days)}"
    )
    comment = (response.comment or "").strip()
    return f"{line}. {comment}" if comment else line
