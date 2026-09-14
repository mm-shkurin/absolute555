"""One shape for a dialogue and a message."""

from app.shared.http.sale_car_view import seller_view, to_card
from app.shared.storage.s3_service import s3_service


def message_view(message) -> dict:
    return {
        "message_id": message.message_id,
        "dialog_id": message.dialog_id,
        "author_id": message.author_id,
        "kind": message.kind,
        "text": message.text,
        "read_at": message.read_at,
        "created_at": message.created_at,
    }


def request_card(request) -> dict:
    """Заявка в шапке переписки: по ней читатель узнаёт разговор в списке.

    Марка и модель — именами: список диалогов иначе тянул бы справочник на каждую строку.
    """
    return {
        "request_id": request.request_id,
        "brand": request.brand.name_ru if request.brand else None,
        "model": request.model.name if request.model else None,
        "year_from": request.year_from,
        "budget_max": request.budget_max,
        "status": request.status,
    }


def storefront_card(profile) -> dict:
    return {
        "user_id": profile.user_id,
        "company_name": profile.company_name,
        "cover_url": s3_service.get_public_photo_url(profile.cover_key) if profile.cover_key else None,
    }


def dialog_view(dialog, viewer_id, unread: int, last=None, review=None, storefront=None) -> dict:
    """A dialogue as one of its two people sees it.

    The counterpart is whichever of the pair is not asking — a screen showing "you" as
    the person you are talking to is a screen nobody can read.
    """
    other = dialog.seller if str(dialog.buyer_id) == str(viewer_id) else dialog.buyer
    return {
        "dialog_id": dialog.dialog_id,
        "sale_car_id": dialog.sale_car_id,
        "listing": to_card(dialog.listing) if dialog.listing is not None else None,
        # Разговор висит либо на объявлении, либо на заявке: заполнено ровно одно.
        "request": request_card(dialog.request) if dialog.request is not None else None,
        "storefront": storefront_card(storefront) if storefront is not None else None,
        "counterpart": seller_view(other),
        "last_message": message_view(last) if last is not None else None,
        "unread": unread,
        "can_review": str(dialog.buyer_id) == str(viewer_id) and review is None,
        "review_id": review.review_id if review is not None else None,
    }
