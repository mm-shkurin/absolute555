"""Одна форма заявки на проводе.

Марка и модель отдаются именами, а не идентификаторами: заявку читает поставщик, и
второй запрос в справочник ради подписи строки — это двадцать запросов на страницу.
"""


def request_view(request) -> dict:
    return {
        "request_id": request.request_id,
        "user_id": request.user_id,
        "brand": request.brand.name_ru if request.brand else None,
        "model": request.model.name if request.model else None,
        "year_from": request.year_from,
        "budget_max": request.budget_max,
        "comment": request.comment,
        "status": request.status,
        "responses_count": len(request.responses or []),
        "created_at": request.created_at,
    }


def request_views(requests) -> list:
    return [request_view(one) for one in requests]
