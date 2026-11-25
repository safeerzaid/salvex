"""
KYC routes for applicants (bidders and sellers), plus the one authorised way to read a stored file.

Uploads send the file itself as the request body, with its type in Content-Type, for example
    POST /api/kyc/submissions/{id}/documents?document_type=identity_proof
    Content-Type: application/pdf
    <the file's bytes>
(in the browser: `fetch(url, {method: "POST", body: file, headers: {"Content-Type": file.type, ...}})`).
This avoids multipart form parsing, which FastAPI would need the extra python-multipart package for, and
lets the size limit be enforced while the body is still arriving.
"""
import hashlib
import uuid

from fastapi import APIRouter, Depends, Query, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import AuthContext, get_auth_context, require_csrf, require_role
from app.api.uploads import read_body_capped
from app.core.audit import record_audit
from app.core.config import settings
from app.core.errors import ApiError
from app.core.rate_limit import enforce_rate_limit
from app.db.session import get_db
from app.schemas.kyc import AadhaarRequest, DocumentType, KycDocumentOut, KycSubmissionOut, MyKycOut
from app.services.aadhaar import masked
from app.services import kyc as kyc_service
from app.services.kyc_files import EXTENSIONS
from app.services.storage import PrivateStorage, StorageError, get_private_storage

router = APIRouter(prefix="/api/kyc", tags=["KYC"])

applicant_only = require_role(["bidder", "seller"])


async def _submission_out(db: AsyncSession, submission_id: uuid.UUID) -> KycSubmissionOut:
    submission = await kyc_service.load_submission(db, submission_id)
    return KycSubmissionOut.model_validate(submission).model_copy(update={
        "aadhaar_masked": masked(submission.aadhaar_last4),
        "required_documents": await kyc_service.missing_documents(db, submission.id),
        "all_required_documents": kyc_service.required_document_types(),
        "aadhaar_number_needed": settings.KYC_REQUIRE_AADHAAR_NUMBER and not submission.aadhaar_last4,
    })


@router.get("/me", response_model=MyKycOut, summary="Your KYC status and latest submission")
async def my_kyc(request: Request, ctx: AuthContext = Depends(get_auth_context), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    latest = await kyc_service.latest_submission_id(db, ctx.user.id)
    return MyKycOut(kyc_status=ctx.user.kyc_status,
                    submission=await _submission_out(db, latest) if latest else None)


@router.post("/submissions", response_model=KycSubmissionOut, status_code=status.HTTP_201_CREATED,
             summary="Start a KYC submission (draft)", dependencies=[Depends(applicant_only)])
async def start_submission(request: Request, ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    submission = await kyc_service.start_submission(db, ctx.user)
    await db.commit()
    return await _submission_out(db, submission.id)


@router.post("/submissions/{submission_id}/documents", response_model=KycDocumentOut,
             status_code=status.HTTP_201_CREATED, dependencies=[Depends(applicant_only)],
             summary="Upload one document (PDF, JPEG or PNG) as the raw request body",
             # Documentation only: describes the raw-file body so the API test page offers a file picker.
             openapi_extra={"requestBody": {"required": True, "content": {
                 t: {"schema": {"type": "string", "format": "binary"}} for t in ("application/pdf", "image/jpeg", "image/png")}}})
async def upload_document(
    submission_id: uuid.UUID,
    request: Request,
    document_type: DocumentType = Query(..., description="aadhaar_card, pan_card, cancelled_cheque or other"),
    ctx: AuthContext = Depends(require_csrf),
    db: AsyncSession = Depends(get_db),
    storage: PrivateStorage = Depends(get_private_storage),
):
    enforce_rate_limit("upload", request)
    data = await read_body_capped(request, settings.KYC_MAX_FILE_BYTES)
    document, key = await kyc_service.add_document(
        db, storage, ctx.user, submission_id, document_type, data, request.headers.get("content-type"))
    try:
        await db.commit()
    except BaseException:
        storage.delete(key)            # nothing recorded, so keep nothing
        raise
    return KycDocumentOut.model_validate(document)


@router.delete("/documents/{document_id}", response_model=KycDocumentOut, dependencies=[Depends(applicant_only)],
               summary="Withdraw a document (kept on record, no longer part of the submission)")
async def withdraw_document(document_id: uuid.UUID, request: Request,
                            ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    document = await kyc_service.withdraw_document(db, ctx.user, document_id)
    await db.commit()
    return KycDocumentOut.model_validate(document)


@router.put("/submissions/{submission_id}/aadhaar", response_model=KycSubmissionOut,
            summary="Enter your Aadhaar number (only the last 4 digits are kept)", dependencies=[Depends(applicant_only)])
async def set_aadhaar(submission_id: uuid.UUID, body: AadhaarRequest, request: Request,
                      ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("upload", request)
    await kyc_service.set_aadhaar(db, ctx.user, submission_id, body.aadhaar_number)
    await db.commit()
    return await _submission_out(db, submission_id)


@router.post("/submissions/{submission_id}/submit", response_model=KycSubmissionOut,
             dependencies=[Depends(applicant_only)], summary="Send the submission for review")
async def submit(submission_id: uuid.UUID, request: Request,
                 ctx: AuthContext = Depends(require_csrf), db: AsyncSession = Depends(get_db)):
    enforce_rate_limit("session", request)
    await kyc_service.submit(db, ctx.user, submission_id)
    await db.commit()
    return await _submission_out(db, submission_id)


@router.get("/documents/{document_id}/file", summary="Download a document (owner or administrator only)",
            response_class=Response, responses={200: {"content": {"application/pdf": {}, "image/jpeg": {}, "image/png": {}}}})
async def download_document(
    document_id: uuid.UUID,
    request: Request,
    ctx: AuthContext = Depends(get_auth_context),
    db: AsyncSession = Depends(get_db),
    storage: PrivateStorage = Depends(get_private_storage),
):
    enforce_rate_limit("session", request)
    document = await kyc_service.readable_document(db, ctx.user, document_id)
    try:
        data = storage.read(document.storage_key)
    except StorageError:
        raise ApiError(500, "The document is not available. Please contact support.", "kyc_file_unavailable") from None
    if hashlib.sha256(data).hexdigest() != document.sha256:
        raise ApiError(500, "The document failed an integrity check. Please contact support.", "kyc_file_integrity")
    if ctx.user.id != document.user_id:          # an administrator reading someone else's identity document
        await record_audit(db, actor=ctx.user, action="kyc.document_view", target_type="kyc_document",
                           target_id=document.id, details={"submission_id": document.submission_id})
        await db.commit()
    return Response(
        content=data,
        media_type=document.content_type,
        headers={
            # Always a download, never rendered by the browser on this origin.
            "Content-Disposition": f'attachment; filename="kyc-{document.id}.{EXTENSIONS[document.content_type]}"',
            "Cache-Control": "no-store, private",
            "Pragma": "no-cache",
            "Content-Security-Policy": "default-src 'none'; sandbox",
            "Cross-Origin-Resource-Policy": "same-origin",
        },
    )
