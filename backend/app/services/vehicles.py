"""
Vehicle workflow (Module 4). Functions add changes and audit entries to the caller's session WITHOUT
committing; the route commits once.

Who may do what:
  * the person who added a vehicle may edit it, add/remove photos and submit it while it is a draft or
    changes were requested;
  * an admin may do the same on ANY vehicle (except a rejected one) and reviews submitted vehicles;
    an admin changing someone else's vehicle is audit-logged with the names of the fields changed;
  * everyone else is told the vehicle does not exist (404).
Review: submitted -> approved | rejected | changes_requested. Only approved vehicles are public.
"""
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.audit import record_audit
from app.core.config import settings
from app.core.errors import ApiError
from app.models.user import User
from app.models.vehicle import ACTIVE_STATUSES, EDITABLE_STATUSES, Vehicle, VehiclePhoto
from app.services.auctions import require_free_to_relist, vehicle_locked_by_auction
from app.services.image_meta import strip_metadata
from app.services.kyc_files import JPEG, PNG, validate_upload
from app.services.notifications import notify, notify_admins
from app.services.storage import PrivateStorage

REVIEW_STATUS = {"approve": "approved", "reject": "rejected", "request_changes": "changes_requested"}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _duplicate() -> ApiError:
    return ApiError(409, "A vehicle with this registration number is already listed.", "registration_exists")


def _not_found() -> ApiError:
    return ApiError(404, "Vehicle not found.", "vehicle_not_found")


def is_admin(user: User) -> bool:
    return user.role == "admin"


async def load_vehicle(db: AsyncSession, vehicle_id: uuid.UUID) -> Optional[Vehicle]:
    stmt = select(Vehicle).where(Vehicle.id == vehicle_id).options(selectinload(Vehicle.photos))
    return (await db.execute(stmt.execution_options(populate_existing=True))).scalar_one_or_none()


async def readable_vehicle(db: AsyncSession, actor: User, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = await load_vehicle(db, vehicle_id)
    if vehicle is None or (vehicle.owner_id != actor.id and not is_admin(actor)):
        raise _not_found()
    return vehicle


async def _lock_editable(db: AsyncSession, actor: User, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if vehicle is None or (vehicle.owner_id != actor.id and not is_admin(actor)):
        raise _not_found()
    allowed = EDITABLE_STATUSES if not is_admin(actor) else ("draft", "submitted", "changes_requested", "approved")
    if vehicle.status not in allowed:
        raise ApiError(409, "This vehicle can no longer be changed.", "vehicle_not_editable")
    if vehicle.status == "approved" and await vehicle_locked_by_auction(db, vehicle.id):
        # Only an UNFINISHED auction or a sale that still stands locks a vehicle. Once its last auction
        # has finished it can be edited, auctioned again, or relisted (client, 2026-11-26).
        raise ApiError(409, "This vehicle is in an auction that has not finished, or sold with the sale "
                            "still standing, so it cannot be changed yet.", "vehicle_in_auction")
    return vehicle


async def _flush_or_duplicate(db: AsyncSession) -> None:
    try:
        await db.flush()
    except IntegrityError:            # the partial unique index on active registration numbers
        await db.rollback()
        raise _duplicate() from None


async def registration_available(db: AsyncSession, registration_number: str) -> bool:
    found = (await db.execute(
        select(Vehicle.id).where(Vehicle.registration_number == registration_number, Vehicle.status.in_(ACTIVE_STATUSES))
    )).first()
    return found is None


# ---------------------------------------------------------------------------- vehicle details
def _only_admin_lists_ready_to_lift(actor: User, listing: str) -> None:
    if listing == "ready_to_lift" and actor.role != "admin":
        raise ApiError(403, "Only the Salvex team can list Ready to Lift vehicles.", "ready_to_lift_admin_only")


async def create_vehicle(db: AsyncSession, actor: User, fields: dict) -> Vehicle:
    _only_admin_lists_ready_to_lift(actor, fields.get("listing_type", "auction"))
    if not await registration_available(db, fields["registration_number"]):
        raise _duplicate()
    vehicle = Vehicle(owner_id=actor.id, status="draft", **fields)
    db.add(vehicle)
    await _flush_or_duplicate(db)
    return vehicle


async def update_vehicle(db: AsyncSession, actor: User, vehicle_id: uuid.UUID, changes: dict) -> Vehicle:
    vehicle = await _lock_editable(db, actor, vehicle_id)
    manufacturing = changes.get("manufacturing_year", vehicle.manufacturing_year)
    registration = changes.get("registration_year", vehicle.registration_year)
    if registration < manufacturing:
        raise ApiError(422, "Registration year cannot be before the manufacturing year.", "invalid_years")
    listing = changes.get("listing_type", vehicle.listing_type)
    if "listing_type" in changes:
        _only_admin_lists_ready_to_lift(actor, listing)
    if listing == "ready_to_lift" and (changes.get("km_driven", vehicle.km_driven) is None
                                       or changes.get("superdari", vehicle.superdari) is None):
        raise ApiError(422, "Ready to Lift vehicles need KM driven and Superdari (Yes / No).", "ready_to_lift_details")
    if "listing_type" in changes and changes["listing_type"] != vehicle.listing_type and vehicle.status == "approved":
        # A finished auction no longer holds the vehicle: it can go to Ready to Lift, or back into an
        # auction, as often as needed (client, 2026-11-26).
        await require_free_to_relist(db, vehicle.id, "change the listing")
    damage = changes.get("damage_type", vehicle.damage_type)
    if damage == "other":
        if not changes.get("damage_other", vehicle.damage_other):
            raise ApiError(422, "Describe the damage when the damage type is Other.", "damage_description_required")
    elif "damage_type" in changes or "damage_other" in changes:
        changes = {**changes, "damage_other": None}          # a description only belongs to "Other"
    changed = sorted(name for name, value in changes.items() if getattr(vehicle, name) != value)
    for name in changed:
        setattr(vehicle, name, changes[name])
    await _flush_or_duplicate(db)
    if changed and vehicle.owner_id != actor.id:
        await record_audit(db, actor=actor, action="vehicle.admin_edit", target_type="vehicle", target_id=vehicle.id,
                           details={"fields": changed, "status": vehicle.status})
    return vehicle


# ---------------------------------------------------------------------------- photos
async def add_photo(db: AsyncSession, storage: PrivateStorage, actor: User, vehicle_id: uuid.UUID,
                    data: bytes, declared_type: Optional[str]) -> tuple[VehiclePhoto, str]:
    content_type = validate_upload(data, declared_type, settings.VEHICLE_MAX_PHOTO_BYTES, allowed=(JPEG, PNG))
    data = strip_metadata(data, content_type)          # no GPS location / phone details on the website
    vehicle = await _lock_editable(db, actor, vehicle_id)
    count, last = (await db.execute(
        select(func.count(), func.max(VehiclePhoto.position)).select_from(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id)
    )).one()
    if count >= settings.VEHICLE_MAX_PHOTOS:
        raise ApiError(409, f"A vehicle can have at most {settings.VEHICLE_MAX_PHOTOS} photos.", "too_many_photos")
    key = storage.save(data, area="vehicles")
    try:
        photo = VehiclePhoto(vehicle_id=vehicle.id, storage_key=key, content_type=content_type,
                             size_bytes=len(data), sha256=hashlib.sha256(data).hexdigest(),
                             position=(last + 1) if last is not None else 0)
        db.add(photo)
        vehicle.updated_at = _now()
        await db.flush()
    except BaseException:
        storage.delete(key)
        raise
    return photo, key


THUMB_MAX_BYTES = 400 * 1024


async def _own_photo(db: AsyncSession, vehicle: Vehicle, photo_id: uuid.UUID) -> VehiclePhoto:
    photo = (await db.execute(
        select(VehiclePhoto).where(VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle.id).with_for_update()
    )).scalar_one_or_none()
    if photo is None:
        raise ApiError(404, "Photo not found.", "photo_not_found")
    return photo


async def set_thumbnail(db: AsyncSession, storage: PrivateStorage, actor: User, vehicle_id: uuid.UUID,
                        photo_id: uuid.UUID, data: bytes, declared_type: Optional[str]) -> tuple[str, Optional[str]]:
    """Store the small version of a photo (made by the browser). Returns (new key, old key to delete after commit)."""
    content_type = validate_upload(data, declared_type, THUMB_MAX_BYTES, allowed=(JPEG, PNG))
    data = strip_metadata(data, content_type)
    vehicle = await _lock_editable(db, actor, vehicle_id)
    photo = await _own_photo(db, vehicle, photo_id)
    old = photo.thumb_key
    key = storage.save(data, area="vehicles")
    photo.thumb_key, photo.thumb_sha256 = key, hashlib.sha256(data).hexdigest()
    try:
        await db.flush()
    except BaseException:
        storage.delete(key)
        raise
    return key, old


async def reorder_photos(db: AsyncSession, actor: User, vehicle_id: uuid.UUID, photo_ids: list[uuid.UUID]) -> None:
    """Set the photo order; the first photo is the cover. The list must name every photo of the vehicle once."""
    vehicle = await _lock_editable(db, actor, vehicle_id)
    photos = (await db.execute(select(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id).with_for_update())).scalars().all()
    if len(photo_ids) != len(set(photo_ids)) or set(photo_ids) != {p.id for p in photos}:
        raise ApiError(422, "Send every photo of this vehicle exactly once.", "photo_order_mismatch")
    by_id = {p.id: p for p in photos}
    for position, pid in enumerate(photo_ids):
        by_id[pid].position = position
    vehicle.updated_at = _now()
    await db.flush()


async def remove_photo(db: AsyncSession, actor: User, vehicle_id: uuid.UUID, photo_id: uuid.UUID) -> list[str]:
    """Delete the photo record; returns the storage keys so the route can delete the files after the commit."""
    vehicle = await _lock_editable(db, actor, vehicle_id)
    photo = (await db.execute(
        select(VehiclePhoto).where(VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle.id)
    )).scalar_one_or_none()
    if photo is None:
        raise ApiError(404, "Photo not found.", "photo_not_found")
    if vehicle.status == "approved":                       # a published vehicle always keeps a photo
        count = (await db.execute(select(func.count()).select_from(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))).scalar_one()
        if count <= settings.VEHICLE_MIN_PHOTOS:
            raise ApiError(409, "A vehicle on the website needs at least one photo. Add another photo first, then delete this one.",
                           "last_photo")
    keys = [photo.storage_key] + ([photo.thumb_key] if photo.thumb_key else [])
    await db.delete(photo)
    vehicle.updated_at = _now()
    await db.flush()
    return keys


async def readable_photo(db: AsyncSession, vehicle_id: uuid.UUID, photo_id: uuid.UUID,
                         actor: Optional[User]) -> VehiclePhoto:
    """Anyone may see photos of an APPROVED vehicle; otherwise only its owner and admins."""
    row = (await db.execute(
        select(VehiclePhoto, Vehicle.status, Vehicle.owner_id).join(Vehicle, Vehicle.id == VehiclePhoto.vehicle_id)
        .where(VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle_id)
    )).first()
    if row is None:
        raise ApiError(404, "Photo not found.", "photo_not_found")
    photo, status, owner_id = row
    if status == "approved" or (actor is not None and (actor.id == owner_id or is_admin(actor))):
        return photo
    raise ApiError(404, "Photo not found.", "photo_not_found")


# ---------------------------------------------------------------------------- submit and review
async def submit_vehicle(db: AsyncSession, actor: User, vehicle_id: uuid.UUID) -> Vehicle:
    vehicle = await _lock_editable(db, actor, vehicle_id)
    if vehicle.status not in EDITABLE_STATUSES:
        raise ApiError(409, "This vehicle is not a draft.", "vehicle_not_editable")
    count = (await db.execute(select(func.count()).select_from(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))).scalar_one()
    if count < settings.VEHICLE_MIN_PHOTOS:
        raise ApiError(422, f"Add at least {settings.VEHICLE_MIN_PHOTOS} photo(s) before submitting.", "photos_required")
    previous = vehicle.status
    vehicle.status = "submitted"
    vehicle.submitted_at = _now()
    await record_audit(db, actor=actor, action="vehicle.submit", target_type="vehicle", target_id=vehicle.id,
                       details={"previous_status": previous})
    if not is_admin(actor):
        await notify_admins(db, "vehicle_submitted", "New vehicle to review",
                            f"{vehicle.make} {vehicle.model} ({vehicle.registration_number}) was submitted.",
                            f"/admin?tab=vehicles&status=submitted&open={vehicle.id}")
    return vehicle


async def review_vehicle(db: AsyncSession, actor: User, vehicle_id: uuid.UUID, decision: str,
                         reason: Optional[str]) -> Vehicle:
    vehicle = (await db.execute(
        select(Vehicle).where(Vehicle.id == vehicle_id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if vehicle is None:
        raise _not_found()
    reviewer = (await db.execute(
        select(User).where(User.id == actor.id).with_for_update().execution_options(populate_existing=True)
    )).scalar_one_or_none()
    if reviewer is None or reviewer.role != "admin" or not reviewer.is_active:   # rights lost mid-request
        raise ApiError(403, "Access denied. You do not have permission to do this.", "forbidden")
    if vehicle.status != "submitted":
        raise ApiError(409, "This vehicle is not waiting for review.", "vehicle_not_awaiting_review")
    vehicle.status = REVIEW_STATUS[decision]
    vehicle.reviewed_at = _now()
    vehicle.reviewed_by_id = actor.id
    vehicle.review_reason = reason
    await record_audit(db, actor=actor, action=f"vehicle.{decision}", target_type="vehicle", target_id=vehicle.id,
                       details={"reason": reason, "registration_number": vehicle.registration_number})
    if vehicle.owner_id != actor.id:
        title = {"approve": "Vehicle approved", "reject": "Vehicle not accepted", "request_changes": "Vehicle: changes needed"}[decision]
        body = f"{vehicle.make} {vehicle.model} ({vehicle.registration_number})" + (f": {reason}" if reason else " is approved and visible on the website.")
        await notify(db, vehicle.owner_id, "vehicle_review", title, body, "/seller/dashboard")
    return vehicle
