"""Карта замеров на проводе: одна панель, вся карта и сводка по ней.

Отделено от `sale_car_view` по границе, которая была в нём с истории 14: замеры — своя
сущность со своим правилом полноты, а выдача объявления лишь несёт её сводку. Разрез
понадобился, когда файл выдачи упёрся в лимит в 200 строк.
"""

from app.features.listing.panels import TOTAL_PANELS, status_of
from app.shared.storage.s3_service import s3_service


def _measurement_view(measured) -> dict:
    return {
        "panel": measured.panel,
        "value_um": measured.value_um,
        "status": status_of(measured.value_um),
        "source": measured.value_source,
        "ocr_value_um": measured.ocr_value_um,
        "photo_url": s3_service.get_public_photo_url(measured.photo_key),
        "updated_at": measured.updated_at,
    }


def to_thickness_map(listing, measurements) -> dict:
    held = list(measurements)
    return {
        "sale_car_id": str(listing.sale_car_id),
        "measurements": [_measurement_view(one) for one in held],
        **thickness_summary(held),
    }


def thickness_summary(measurements) -> dict:
    """Сколько панелей измерено и полна ли карта. Полная — это все тринадцать."""
    measured = len(list(measurements))
    return {
        "measured_panels": measured,
        "total_panels": TOTAL_PANELS,
        "is_complete": measured >= TOTAL_PANELS,
    }
