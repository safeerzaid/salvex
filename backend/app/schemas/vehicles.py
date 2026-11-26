"""
Vehicle request/response shapes.

The public catalogue shape deliberately leaves out the claim number, who added the vehicle and the review
notes, and shows the registration number masked (e.g. KL07**1234). That is a provisional privacy default
until the company says otherwise (docs/MASTER_PLAN.md).
"""
import re
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.models.vehicle import OPTIONS

_REG_FORMATTING = re.compile(r"[\s\-.]")
_REG = re.compile(r"^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{4,12}$")
MIN_YEAR = 1950


def normalise_registration(value: str) -> str:
    clean = _REG_FORMATTING.sub("", (value or "").upper())
    if not _REG.match(clean):
        raise ValueError("Enter a valid registration number (letters and digits, e.g. KL07AB1234).")
    return clean


def _text(value: str, label: str) -> str:
    clean = " ".join((value or "").split())
    if not clean:
        raise ValueError(f"{label} is required.")
    if "<" in clean or ">" in clean or any(ord(ch) < 32 or ord(ch) == 127 for ch in clean):
        raise ValueError(f"{label} contains invalid characters.")
    return clean


def _option(field: str, value: str) -> str:
    if value not in OPTIONS[field]:
        raise ValueError(f"Choose one of: {', '.join(OPTIONS[field])}.")
    return value


class _VehicleFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    @field_validator("registration_number", check_fields=False)
    @classmethod
    def _registration(cls, v):
        return None if v is None else normalise_registration(v)

    @field_validator("damage_other", check_fields=False)
    @classmethod
    def _damage_other(cls, v):
        if v is None:
            return None
        clean = _text(v, "Damage description") if str(v).strip() else ""
        return clean or None

    @field_validator("claim_number", "make", "model", "variant", "location", check_fields=False)
    @classmethod
    def _texts(cls, v, info):
        return None if v is None else _text(v, info.field_name.replace("_", " ").capitalize())

    @field_validator("category", "fuel_type", "transmission", "damage_type", "rc_status", "registration_type",
                     "hypothecation_status", check_fields=False)
    @classmethod
    def _options(cls, v, info):
        return None if v is None else _option(info.field_name, v)

    @field_validator("manufacturing_year", "registration_year", check_fields=False)
    @classmethod
    def _year(cls, v):
        if v is None:
            return v
        latest = datetime.now(timezone.utc).year + 1
        if not MIN_YEAR <= v <= latest:
            raise ValueError(f"Enter a year between {MIN_YEAR} and {latest}.")
        return v


class VehicleCreate(_VehicleFields):
    category: str = "used_vehicle"
    listing_type: Literal["auction", "ready_to_lift"] = "auction"
    km_driven: Optional[int] = Field(None, ge=0, le=2_000_000)
    superdari: Optional[bool] = None
    registration_number: str = Field(..., max_length=20)
    claim_number: str = Field(..., max_length=50)
    make: str = Field(..., max_length=60)
    model: str = Field(..., max_length=60)
    variant: str = Field(..., max_length=80)
    manufacturing_year: int
    registration_year: int
    fuel_type: str
    transmission: str
    number_of_owners: int = Field(..., ge=0, le=20)
    damage_type: str
    damage_other: Optional[str] = Field(None, max_length=120)
    location: str = Field(..., max_length=120)
    rc_status: str
    registration_type: str
    hypothecation_status: str

    @model_validator(mode="after")
    def _years_in_order(self):
        if self.registration_year < self.manufacturing_year:
            raise ValueError("Registration year cannot be before the manufacturing year.")
        if self.damage_type == "other" and not self.damage_other:
            raise ValueError("Describe the damage when the damage type is Other.")
        if self.damage_type != "other":
            self.damage_other = None
        if self.listing_type == "ready_to_lift" and (self.km_driven is None or self.superdari is None):
            raise ValueError("Ready to Lift vehicles need KM driven and Superdari (Yes / No).")
        return self


class VehicleUpdate(_VehicleFields):
    """Change any of the fields; only the fields sent are changed. None is not accepted for any field."""
    category: Optional[str] = None
    listing_type: Optional[Literal["auction", "ready_to_lift"]] = None
    km_driven: Optional[int] = Field(None, ge=0, le=2_000_000)
    superdari: Optional[bool] = None
    registration_number: Optional[str] = Field(None, max_length=20)
    claim_number: Optional[str] = Field(None, max_length=50)
    make: Optional[str] = Field(None, max_length=60)
    model: Optional[str] = Field(None, max_length=60)
    variant: Optional[str] = Field(None, max_length=80)
    manufacturing_year: Optional[int] = None
    registration_year: Optional[int] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    number_of_owners: Optional[int] = Field(None, ge=0, le=20)
    damage_type: Optional[str] = None
    damage_other: Optional[str] = Field(None, max_length=120)
    location: Optional[str] = Field(None, max_length=120)
    rc_status: Optional[str] = None
    registration_type: Optional[str] = None
    hypothecation_status: Optional[str] = None

    @model_validator(mode="after")
    def _non_empty(self):
        if not self.model_fields_set:
            raise ValueError("Send at least one field to change.")
        if any(getattr(self, name) is None for name in self.model_fields_set
               if name not in ("damage_other", "km_driven", "superdari")):
            raise ValueError("Fields cannot be set to empty.")
        return self


class VehiclePhotoOut(BaseModel):
    id: uuid.UUID
    content_type: str
    size_bytes: int
    uploaded_at: datetime
    position: int = 0
    has_thumbnail: bool = False

    @model_validator(mode="before")
    @classmethod
    def _thumb(cls, value):
        if hasattr(value, "thumb_key"):
            return {"id": value.id, "content_type": value.content_type, "size_bytes": value.size_bytes,
                    "uploaded_at": value.uploaded_at, "position": value.position, "has_thumbnail": bool(value.thumb_key)}
        return value


class PhotoOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")
    photo_ids: List[uuid.UUID] = Field(min_length=1, max_length=100)

    model_config = ConfigDict(from_attributes=True)


class _VehicleCommon(BaseModel):
    id: uuid.UUID
    category: str
    listing_type: str = "auction"
    km_driven: Optional[int] = None
    superdari: Optional[bool] = None
    sold_at: Optional[datetime] = None
    make: str
    model: str
    variant: str
    manufacturing_year: int
    registration_year: int
    fuel_type: str
    transmission: str
    number_of_owners: int
    damage_type: str
    damage_other: Optional[str] = None
    location: str
    rc_status: str
    registration_type: str
    hypothecation_status: str

    model_config = ConfigDict(from_attributes=True)


class VehicleOut(_VehicleCommon):
    """What the person who added the vehicle (and admins) see."""
    status: str
    registration_number: str
    claim_number: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]
    review_reason: Optional[str]
    photos: List[VehiclePhotoOut]


class AdminVehicleOut(VehicleOut):
    owner_id: uuid.UUID
    reviewed_by_id: Optional[uuid.UUID]
    locked: bool = False            # in an open auction or sold: details and photos cannot change


class AdminVehicleRow(BaseModel):
    id: uuid.UUID
    status: str
    category: str
    listing_type: str = "auction"
    sold_at: Optional[datetime] = None
    registration_number: str
    make: str
    model: str
    variant: str
    cover_photo_id: Optional[uuid.UUID] = None      # first photo, for the list thumbnail
    manufacturing_year: int
    location: str
    owner_id: uuid.UUID
    created_at: datetime
    submitted_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class OpenAuctionSummary(BaseModel):
    """The open auction on a catalogue card. No starting price: see AuctionPublic for why."""
    id: uuid.UUID
    phase: str
    current_price: Optional[Decimal]
    bid_count: int
    starts_at: datetime
    ends_at: datetime


class CatalogueVehicle(_VehicleCommon):
    """Public view of an APPROVED vehicle. No claim number, owner or review notes.

    The registration number is shown in full: the client asked for it on 2026-11-25, replacing the
    earlier partial mask (KL07AB1234 -> KL07**1234)."""
    registration_number: str
    photo_ids: List[uuid.UUID]
    auction: Optional[OpenAuctionSummary] = None     # the vehicle's open auction, if any
    sold: bool = False                                # detail page only: sold in an auction / as Ready to Lift

    @classmethod
    def from_vehicle(cls, vehicle, auction=None, now=None) -> "CatalogueVehicle":
        data = _VehicleCommon.model_validate(vehicle).model_dump()
        summary = None
        if auction is not None:
            summary = OpenAuctionSummary(id=auction.id, phase=auction.phase(now),
                                         current_price=auction.current_price, bid_count=auction.bid_count,
                                         starts_at=auction.starts_at, ends_at=auction.ends_at)
        return cls(**data, registration_number=vehicle.registration_number,
                   photo_ids=[p.id for p in vehicle.photos], auction=summary)


class VehicleReviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: str = Field(..., pattern="^(approve|reject|request_changes)$")
    reason: Optional[str] = Field(None, max_length=1000)

    @model_validator(mode="after")
    def _reason_needed(self):
        reason = " ".join((self.reason or "").split())
        if self.decision != "approve" and len(reason) < 3:
            raise ValueError("A reason of at least 3 characters is required to reject or request changes.")
        if any(ord(ch) < 32 or ord(ch) == 127 for ch in reason):
            raise ValueError("The reason contains invalid characters.")
        self.reason = reason or None
        return self


class RegistrationCheck(BaseModel):
    registration_number: str
    available: bool
