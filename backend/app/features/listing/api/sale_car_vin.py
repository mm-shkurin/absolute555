"""Распознавание по VIN, который продавец вписал руками.

Отдельно от правки объявления намеренно: PATCH сохраняет поле, а это запускает фоновую
задачу, и «сохранил VIN» не должно молча означать «запустил распознавание». Форма ответа
та же, что у снимка СТС, — исход приезжает потоком и полем autofill.
"""

from fastapi import APIRouter, Depends, status
from app.features.listing.deps import get_listing_autofill_service
from app.features.listing.services.listing_lifecycle import ListingLifecycleService

from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.schemas.sale_cars import StsAccepted, VinDecodeRequest
from app.features.listing.services.listing_autofill import ListingAutofillService
from app.features.listing.services.listing_errors import ListingError
from app.utils.security import get_current_user

from app.shared.http.listing_http import listing_of, to_http
from app.shared.http.sale_car_view import autofill_view

vin_router = APIRouter()


@vin_router.post(
    "/{sale_car_id}/decode-vin",
    response_model=StsAccepted,
    status_code=status.HTTP_202_ACCEPTED,
)
async def decode_vin(
    sale_car_id: str,
    body: VinDecodeRequest,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    listing_autofill_service: ListingAutofillService = Depends(get_listing_autofill_service),
    current_user=Depends(get_current_user),
):
    """Accepted, not done: the reading runs on the queue and reports back separately."""
    try:
        listing = await listing_of(listing_lifecycle_service, sale_car_id, current_user)
        updated = await listing_autofill_service.decode_from_vin(listing, body.vin)
    except ListingError as error:
        raise to_http(error)
    return {"sale_car_id": updated.sale_car_id, "autofill": autofill_view(updated)}
