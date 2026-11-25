"""
KYC request/response shapes. Responses never contain the storage key, the checksum or file contents;
files are fetched only through the authorised download route.
"""
import uuid
from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

# PROVISIONAL generic list, as approved in docs/MASTER_PLAN.md section 6 until the company decides which
# documents are required. Nothing is required yet beyond "at least one document" at submission.
# The client's list (Aadhaar copy, PAN card, cancelled cheque) plus the earlier generic types, still accepted.
DocumentType = Literal["aadhaar_card", "pan_card", "cancelled_cheque", "identity_proof", "address_proof",
                       "business_proof", "other"]
DOCUMENT_LABELS = {"aadhaar_card": "Aadhaar card", "pan_card": "PAN card", "cancelled_cheque": "Cancelled cheque",
                   "identity_proof": "Identity proof", "address_proof": "Address proof",
                   "business_proof": "Business proof", "other": "Other document"}


class AadhaarRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    aadhaar_number: str = Field(..., max_length=20)


class KycDocumentOut(BaseModel):
    id: uuid.UUID
    document_type: str
    content_type: str
    size_bytes: int
    uploaded_at: datetime
    withdrawn_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)


class KycDecisionForUser(BaseModel):
    """What the applicant sees about a decision: the outcome, the reason and when (not who)."""
    decision: str
    reason: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class KycDecisionForAdmin(KycDecisionForUser):
    id: uuid.UUID
    reviewer_id: uuid.UUID


class KycSubmissionOut(BaseModel):
    id: uuid.UUID
    status: str
    created_at: datetime
    submitted_at: Optional[datetime]
    decided_at: Optional[datetime]
    documents: List[KycDocumentOut]
    decisions: List[KycDecisionForUser]
    aadhaar_masked: Optional[str] = None          # "XXXX XXXX 1234"
    required_documents: List[str] = []            # document types still needed before submitting
    all_required_documents: List[str] = []        # every document type needed, whether uploaded yet or not
    aadhaar_number_needed: bool = False

    model_config = ConfigDict(from_attributes=True)


class MyKycOut(BaseModel):
    kyc_status: str                                   # the account summary: pending, verified or rejected
    submission: Optional[KycSubmissionOut]            # the latest submission, if any


class KycUserBrief(BaseModel):
    id: uuid.UUID
    name: str
    email: str
    role: str
    kyc_status: str
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class AdminKycSubmissionRow(BaseModel):
    id: uuid.UUID
    status: str
    created_at: datetime
    submitted_at: Optional[datetime]
    decided_at: Optional[datetime]
    user: KycUserBrief

    model_config = ConfigDict(from_attributes=True)


class AdminKycSubmissionDetail(AdminKycSubmissionRow):
    documents: List[KycDocumentOut]
    decisions: List[KycDecisionForAdmin]
    aadhaar_masked: Optional[str] = None
    aadhaar_used_by_other_account: bool = False   # the same Aadhaar is on another account's KYC


class KycDecisionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    decision: Literal["approve", "reject", "request_changes"]
    reason: str = Field(..., min_length=3, max_length=1000, description="Shown to the applicant and kept on record")

    @field_validator("reason")
    @classmethod
    def _reason(cls, v: str) -> str:
        clean = v.strip()
        if len(clean) < 3:
            raise ValueError("A reason of at least 3 characters is required.")
        if any((ord(ch) < 32 and ch not in "\n\t") or ord(ch) == 127 for ch in clean):
            raise ValueError("The reason contains invalid characters.")
        return clean
