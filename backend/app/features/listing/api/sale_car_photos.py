"""The gallery of a listing, over HTTP.

multipart rather than base64: fifteen ten-megabyte photographs encoded as base64 are some
two hundred megabytes of JSON held whole in a worker's memory, and there are several
workers to an image.
"""

from typing import List

from fastapi import APIRouter, Depends, File, UploadFile
from app.features.listing.services.listing_lifecycle import ListingLifecycleService
from app.features.listing.deps import get_listing_gallery_service

from app.features.listing.deps import get_listing_lifecycle_service
from app.features.listing.schemas.sale_cars import GalleryResponse, PhotoOrder
from app.features.listing.services.listing_errors import ListingError
from app.features.listing.services.listing_photos import ListingGalleryService
from app.features.listing.services.photo_image import read_limited
from app.utils.security import get_current_user

from app.shared.http.listing_http import listing_of, to_http
from app.shared.http.sale_car_view import to_gallery

photos_router = APIRouter()


async def _own_listing(service, sale_car_id: str, user):
    return await listing_of(service, sale_car_id, user)


@photos_router.post("/{sale_car_id}/photos", response_model=GalleryResponse)
async def upload_photos(
    sale_car_id: str,
    files: List[UploadFile] = File(default=[]),
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    listing_gallery_service: ListingGalleryService = Depends(get_listing_gallery_service),
    current_user=Depends(get_current_user),
):
    try:
        listing = await _own_listing(listing_lifecycle_service, sale_car_id, current_user)
        payload = [(file.filename, file.content_type, await read_limited(file)) for file in files]
        updated = await listing_gallery_service.add(listing, payload)
    except ListingError as error:
        raise to_http(error)
    return to_gallery(updated)


@photos_router.delete("/{sale_car_id}/photos/{photo_id}", response_model=GalleryResponse)
async def delete_photo(
    sale_car_id: str,
    photo_id: str,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    listing_gallery_service: ListingGalleryService = Depends(get_listing_gallery_service),
    current_user=Depends(get_current_user),
):
    try:
        listing = await _own_listing(listing_lifecycle_service, sale_car_id, current_user)
        updated = await listing_gallery_service.remove(listing, photo_id)
    except ListingError as error:
        raise to_http(error)
    return to_gallery(updated)


@photos_router.put("/{sale_car_id}/photos/order", response_model=GalleryResponse)
async def reorder_photos(
    sale_car_id: str,
    order: PhotoOrder,
    listing_lifecycle_service: ListingLifecycleService = Depends(get_listing_lifecycle_service),
    listing_gallery_service: ListingGalleryService = Depends(get_listing_gallery_service),
    current_user=Depends(get_current_user),
):
    try:
        listing = await _own_listing(listing_lifecycle_service, sale_car_id, current_user)
        updated = await listing_gallery_service.reorder(listing, order.photo_ids)
    except ListingError as error:
        raise to_http(error)
    return to_gallery(updated)
