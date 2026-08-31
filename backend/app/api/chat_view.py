"""One shape for a dialogue and a message."""

from .sale_car_view import seller_view, to_card


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


def dialog_view(dialog, viewer_id, unread: int, last=None) -> dict:
    """A dialogue as one of its two people sees it.

    The counterpart is whichever of the pair is not asking — a screen showing "you" as
    the person you are talking to is a screen nobody can read.
    """
    other = dialog.seller if str(dialog.buyer_id) == str(viewer_id) else dialog.buyer
    return {
        "dialog_id": dialog.dialog_id,
        "sale_car_id": dialog.sale_car_id,
        "listing": to_card(dialog.listing) if dialog.listing is not None else None,
        "counterpart": seller_view(other),
        "last_message": message_view(last) if last is not None else None,
        "unread": unread,
    }
