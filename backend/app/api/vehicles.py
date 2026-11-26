"""
Vehicle routes.

  /api/vehicles   - sellers and admins add and manage vehicles (signed in; writes need the CSRF token).
  /api/catalogue  - the PUBLIC catalogue: approved vehicles only, no sign-in, no claim number, masked
                    registration number.

Photos are uploaded as the raw request body (Content-Type image/jpeg or image/png), like KYC documents.
"""
import hashlib
import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import AuthContext, get_auth_context, require_csrf, require_role
from app.api.pagination import PaginationParams, paginate, pagination_params
from app.api.uploads import read_body_capped
from app.core.config import settings
from app.core.errors import ApiError
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.models.user import User
from app.models.auction import OPEN_STATUSES, Auction
from app.models.vehicle import OPTIONS, Vehicle
from app.schemas.common import Page
from app.schemas.vehicles import (
    AdminVehicleOut,
    CatalogueVehicle,
    OpenAuctionSummary,
    RegistrationCheck,
    VehicleCreate,
    VehicleOut,
    PhotoOrder,
    VehiclePhotoOut,
    VehicleUpdate,
    normalise_registration,
)
from app.services import vehicles as vehicle_service
from app.services.auctions import now_utc, sold_by_auction
from app.services.kyc_files import EXTENSIONS
from app.services.storage import PrivateStorage, StorageError, get_private_storage

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"], dependencies=[Depends(require_role(["seller", "admin"]))])
catalogue = APIRouter(prefix="/api/catalogue", tags=["Public catalogue"])

_SEARCH = r"^[^\x00-\x1f\x7f<>]+$"


def _out(vehicle: Vehicle, viewer: User):
    return (AdminVehicleOut if viewer.role == "admin" else VehicleOut).model_validate(vehicle)


def _like(value: str) -> str:
    return "%" + value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def _photo_response(photo, read: tuple[bytes, str], public: bool) -> Response:
    data, content_type = read
    return Response(
        content=data,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="photo-{photo.id}.{EXTENSIONS[content_type]}"',
            # a photo never changes (a new photo gets a new id), so public ones can be cached for a day
            "Cache-Control": "public, max-age=86400" if public else "private, no-store",
            "Content-Security-Policy": "default-src 'none'; sandbox",
            "Cross-Origin-Resource-Policy": "same-site",
        },
    )


def _read_photo(storage: PrivateStorage, photo, size: str = "full") -> tuple[bytes, str]:
    """The photo (or its thumbnail when asked for and available), checked against its stored hash."""
    use_thumb = size == "thumb" and photo.thumb_key
    key, digest = (photo.thumb_key, photo.thumb_sha256) if use_thumb else (photo.storage_key, photo.sha256)
    try:
        data = storage.read(key)
    except StorageError:
        raise ApiError(500, "The photo is not available.", "photo_unavailable") from None
    if hashlib.sha256(data).hexdigest() != digest:
        raise ApiError(500, "The photo failed an integrity check.", "photo_integrity")
    if use_thumb:
        content_type = "image/png" if data.startswith(b"\x89PNG") else "image/jpeg"
    else:
        content_type = photo.content_type
    return data, content_type


# ---------------------------------------------------------------------------- sellers and admins
@router.post("", response_model=AdminVehicleOut | VehicleOut, status_code=status.HTTP_201_CREATED,
             summary="Add a vehicle (saved as a draft)")
async def create_vehicle(body: VehicleCreate, request: Request,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    vehicle = await vehicle_service.create_vehicle(db, ctx.user, body.model_dump())
    await db.commit()
    return _out(await vehicle_service.load_vehicle(db, vehicle.id), ctx.user)


@router.get("/mine", response_model=Page[VehicleOut], summary="Vehicles you added (newest first)")
async def my_vehicles(params: PaginationParams = Depends(pagination_params),
                      ctx: AuthContext = Depends(get_auth_context), db: AsyncSession = Depends(get_db)):
    stmt = (select(Vehicle).where(Vehicle.owner_id == ctx.user.id).options(selectinload(Vehicle.photos))
            .order_by(Vehicle.created_at.desc(), Vehicle.id.desc()))
    return await paginate(db, stmt, params, VehicleOut)


@router.get("/registration-check", response_model=RegistrationCheck,
            summary="Is this registration number free to list?")
async def registration_check(number: str = Query(..., min_length=4, max_length=20),
                             db: AsyncSession = Depends(get_db)):
    try:
        clean = normalise_registration(number)
    except ValueError as exc:
        raise ApiError(422, str(exc), "invalid_registration") from None
    return RegistrationCheck(registration_number=clean, available=await vehicle_service.registration_available(db, clean))


@router.get("/{vehicle_id}", response_model=AdminVehicleOut | VehicleOut, summary="One of your vehicles")
async def get_vehicle(vehicle_id: uuid.UUID, ctx: AuthContext = Depends(get_auth_context), db: AsyncSession = Depends(get_db)):
    return _out(await vehicle_service.readable_vehicle(db, ctx.user, vehicle_id), ctx.user)


@router.patch("/{vehicle_id}", response_model=AdminVehicleOut | VehicleOut, summary="Change vehicle details")
async def update_vehicle(vehicle_id: uuid.UUID, body: VehicleUpdate, request: Request,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    changes = {name: getattr(body, name) for name in body.model_fields_set}
    await vehicle_service.update_vehicle(db, ctx.user, vehicle_id, changes)
    await db.commit()
    return _out(await vehicle_service.load_vehicle(db, vehicle_id), ctx.user)


@router.post("/{vehicle_id}/photos", response_model=VehiclePhotoOut, status_code=status.HTTP_201_CREATED,
             summary="Upload one photo (JPEG or PNG) as the raw request body",
             # Documentation only: describes the raw-file body so the API test page offers a file picker.
             openapi_extra={"requestBody": {"required": True, "content": {
                 t: {"schema": {"type": "string", "format": "binary"}} for t in ("image/jpeg", "image/png")}}})
async def upload_photo(vehicle_id: uuid.UUID, request: Request, ctx: AuthContext = Depends(require_csrf),
                       db: AsyncSession = Depends(get_db), storage: PrivateStorage = Depends(get_private_storage)):
    enforce_rate_limit("photo", request)
    data = await read_body_capped(request, settings.VEHICLE_MAX_PHOTO_BYTES)
    photo, key = await vehicle_service.add_photo(db, storage, ctx.user, vehicle_id, data, request.headers.get("content-type"))
    try:
        await db.commit()
    except BaseException:
        storage.delete(key)
        raise
    return VehiclePhotoOut.model_validate(photo)


@router.delete("/{vehicle_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a photo")
async def delete_photo(vehicle_id: uuid.UUID, photo_id: uuid.UUID, request: Request,
                       ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db),
                       storage: PrivateStorage = Depends(get_private_storage)):
    enforce_rate_limit("session", request)
    keys = await vehicle_service.remove_photo(db, ctx.user, vehicle_id, photo_id)
    await db.commit()
    for key in keys:                  # only after the record is gone
        storage.delete(key)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/photos/{photo_id}/thumbnail", status_code=status.HTTP_204_NO_CONTENT,
            summary="Upload the small version of a photo (JPEG / PNG, raw body, at most 400 KB) for lists and cards",
            openapi_extra={"requestBody": {"required": True, "content": {
                t: {"schema": {"type": "string", "format": "binary"}} for t in ("image/jpeg", "image/png")}}})
async def upload_thumbnail(vehicle_id: uuid.UUID, photo_id: uuid.UUID, request: Request,
                           ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db),
                           storage: PrivateStorage = Depends(get_private_storage)):
    enforce_rate_limit("photo", request)
    data = await read_body_capped(request, vehicle_service.THUMB_MAX_BYTES)
    key, old = await vehicle_service.set_thumbnail(db, storage, ctx.user, vehicle_id, photo_id, data,
                                                   request.headers.get("content-type"))
    try:
        await db.commit()
    except BaseException:
        storage.delete(key)
        raise
    if old:
        storage.delete(old)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{vehicle_id}/photos/order", response_model=list[VehiclePhotoOut],
            summary="Change the photo order (the first photo is the cover)")
async def reorder_photos(vehicle_id: uuid.UUID, body: PhotoOrder, request: Request,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    await vehicle_service.reorder_photos(db, ctx.user, vehicle_id, body.photo_ids)
    await db.commit()
    vehicle = await vehicle_service.load_vehicle(db, vehicle_id)
    return [VehiclePhotoOut.model_validate(p) for p in vehicle.photos]


@router.get("/{vehicle_id}/photos/{photo_id}", response_class=Response, summary="A photo of one of your vehicles")
async def get_own_photo(vehicle_id: uuid.UUID, photo_id: uuid.UUID, ctx: AuthContext = Depends(get_auth_context),
                        size: Literal["full", "thumb"] = Query("full"),
                        db: AsyncSession = Depends(get_db), storage: PrivateStorage = Depends(get_private_storage)):
    photo = await vehicle_service.readable_photo(db, vehicle_id, photo_id, ctx.user)
    return _photo_response(photo, _read_photo(storage, photo, size), public=False)


@router.post("/{vehicle_id}/submit", response_model=AdminVehicleOut | VehicleOut, summary="Send the vehicle for review")
async def submit_vehicle(vehicle_id: uuid.UUID, request: Request,
                         ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    await vehicle_service.submit_vehicle(db, ctx.user, vehicle_id)
    await db.commit()
    return _out(await vehicle_service.load_vehicle(db, vehicle_id), ctx.user)


# ---------------------------------------------------------------------------- public catalogue
async def _open_auctions(db: AsyncSession, vehicle_ids) -> dict:
    if not vehicle_ids:
        return {}
    rows = (await db.execute(select(Auction).where(Auction.vehicle_id.in_(vehicle_ids), Auction.status.in_(OPEN_STATUSES)))).scalars().all()
    return {a.vehicle_id: a for a in rows}


async def _with_open_auctions(db: AsyncSession, page):
    auctions = await _open_auctions(db, [item.id for item in page.items])
    now = now_utc()
    for item in page.items:
        auction = auctions.get(item.id)
        if auction is not None:
            item.auction = OpenAuctionSummary(id=auction.id, phase=auction.phase(now),
                                              current_price=auction.current_price, bid_count=auction.bid_count,
                                              starts_at=auction.starts_at, ends_at=auction.ends_at)
    return page


@catalogue.get("/vehicle-options", summary="Choices for the vehicle drop-down fields (provisional lists)")
async def vehicle_options():
    return OPTIONS


@catalogue.get("/vehicles", response_model=Page[CatalogueVehicle], summary="Approved vehicles (newest first)")
async def list_catalogue(
    request: Request,
    params: PaginationParams = Depends(pagination_params),
    q: Optional[str] = Query(None, min_length=1, max_length=80, pattern=_SEARCH, description="Make, model or variant"),
    category: Optional[str] = Query(None, max_length=20, description="insurance | bank_nbfc | used_vehicle"),
    listing_type: Optional[Literal["auction", "ready_to_lift"]] = Query(None),
    make: Optional[str] = Query(None, max_length=60, pattern=_SEARCH),
    model: Optional[str] = Query(None, max_length=60, pattern=_SEARCH),
    location: Optional[str] = Query(None, max_length=120, pattern=_SEARCH),
    fuel_type: Optional[str] = Query(None, max_length=20),
    transmission: Optional[str] = Query(None, max_length=20),
    damage_type: Optional[str] = Query(None, max_length=30),
    year_from: Optional[int] = Query(None, ge=1950, le=2100),
    year_to: Optional[int] = Query(None, ge=1950, le=2100),
    db: AsyncSession = Depends(get_db),
):
    enforce_rate_limit("session", request)
    for field, value in (("category", category), ("fuel_type", fuel_type), ("transmission", transmission),
                         ("damage_type", damage_type)):
        if value is not None and value not in OPTIONS[field]:
            raise ApiError(422, f"Unknown {field.replace('_', ' ')}.", "validation_error")
    # sold vehicles (Ready to Lift marked sold, or won in an auction) are no longer offered
    stmt = select(Vehicle).where(Vehicle.status == "approved", Vehicle.sold_at.is_(None), ~sold_by_auction(Vehicle.id)) \
        .options(selectinload(Vehicle.photos))
    if listing_type:
        stmt = stmt.where(Vehicle.listing_type == listing_type)
    if q:
        stmt = stmt.where(or_(*(col.ilike(_like(q), escape="\\") for col in (Vehicle.make, Vehicle.model, Vehicle.variant))))
    for column, value in ((Vehicle.make, make), (Vehicle.model, model), (Vehicle.location, location)):
        if value:
            stmt = stmt.where(column.ilike(_like(value), escape="\\"))
    for column, value in ((Vehicle.category, category), (Vehicle.fuel_type, fuel_type), (Vehicle.transmission, transmission),
                          (Vehicle.damage_type, damage_type)):
        if value:
            stmt = stmt.where(column == value)
    if year_from:
        stmt = stmt.where(Vehicle.manufacturing_year >= year_from)
    if year_to:
        stmt = stmt.where(Vehicle.manufacturing_year <= year_to)
    stmt = stmt.order_by(Vehicle.reviewed_at.desc().nulls_last(), Vehicle.id.desc())
    page = await paginate(db, stmt, params, CatalogueVehicle, transform=CatalogueVehicle.from_vehicle)
    return await _with_open_auctions(db, page)


@catalogue.get("/vehicles/{vehicle_id}", response_model=CatalogueVehicle, summary="One approved vehicle")
async def get_catalogue_vehicle(vehicle_id: uuid.UUID, request: Request, db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    vehicle = await vehicle_service.load_vehicle(db, vehicle_id)
    if vehicle is None or vehicle.status != "approved":
        raise ApiError(404, "Vehicle not found.", "vehicle_not_found")
    auctions = await _open_auctions(db, [vehicle.id])
    out = CatalogueVehicle.from_vehicle(vehicle, auctions.get(vehicle.id), now_utc())
    if vehicle.sold_at is not None or (await db.execute(select(sold_by_auction(vehicle.id)))).scalar():
        out.sold = True                   # an old link still opens, and says the vehicle is sold
    return out


@catalogue.get("/vehicles/{vehicle_id}/photos/{photo_id}", response_class=Response, summary="A photo of an approved vehicle")
async def get_catalogue_photo(vehicle_id: uuid.UUID, photo_id: uuid.UUID, request: Request,
                              size: Literal["full", "thumb"] = Query("full", description="thumb = small version for lists"),
                              db: AsyncSession = Depends(get_db), storage: PrivateStorage = Depends(get_private_storage)):
    enforce_rate_limit("session", request)
    photo = await vehicle_service.readable_photo(db, vehicle_id, photo_id, None)
    return _photo_response(photo, _read_photo(storage, photo, size), public=True)
