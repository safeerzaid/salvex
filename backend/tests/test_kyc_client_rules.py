"""
The client's KYC: Aadhaar number (only last 4 digits kept + keyed hash), Aadhaar copy and PAN card.
The cancelled cheque was required until 2026-11-26, when the client dropped it.
"""
import pytest
from sqlalchemy import select

from app.core.config import settings
from app.models.kyc import KycSubmission
from test_admin_foundation import make_admin
from test_kyc import JPEG, start, storage, upload  # noqa: F401  (storage is a fixture)
from test_users_admin import make_user


async def begin(api):
    _, headers, _ = await make_user(api)
    return headers, await start(api, headers)


VALID = "2345 6789 0124"          # passes the Aadhaar (Verhoeff) check


@pytest.fixture
def client_rules(monkeypatch):
    monkeypatch.setattr(settings, "KYC_REQUIRED_DOCUMENTS", "aadhaar_card,pan_card")
    monkeypatch.setattr(settings, "KYC_REQUIRE_AADHAAR_NUMBER", True)


def test_the_default_required_documents_are_aadhaar_and_pan_only():
    """The client dropped the cancelled cheque on 2026-11-26; a deployment that sets nothing must follow."""
    from app.core.config import Settings

    assert Settings.model_fields["KYC_REQUIRED_DOCUMENTS"].default == "aadhaar_card,pan_card"


async def test_both_documents_and_the_aadhaar_number_are_needed(api, storage, client_rules):
    headers, sid = await begin(api)
    me = (await api.client.get("/api/kyc/me", headers=headers)).json()["submission"]
    assert me["required_documents"] == ["aadhaar_card", "pan_card"] and me["aadhaar_number_needed"]
    assert me["all_required_documents"] == ["aadhaar_card", "pan_card"]

    assert (await upload(api, headers, sid, data=JPEG, content_type="image/jpeg", document_type="aadhaar_card")).status_code == 201
    res = await api.client.post(f"/api/kyc/submissions/{sid}/submit", headers=headers)
    assert res.status_code == 422 and res.json()["code"] == "kyc_documents_missing"
    assert "PAN card" in res.json()["detail"] and "Cancelled cheque" not in res.json()["detail"]
    assert (await upload(api, headers, sid, data=JPEG, content_type="image/jpeg", document_type="pan_card")).status_code == 201
    res = await api.client.post(f"/api/kyc/submissions/{sid}/submit", headers=headers)
    assert res.status_code == 422 and res.json()["code"] == "kyc_aadhaar_missing"

    url = f"/api/kyc/submissions/{sid}/aadhaar"
    for bad in ("1234 5678 9012", "2345 6789 0123", "12345", "abcd efgh ijkl", ""):
        assert (await api.client.put(url, headers=headers, json={"aadhaar_number": bad})).status_code == 422, bad
    ok = await api.client.put(url, headers=headers, json={"aadhaar_number": VALID})
    assert ok.status_code == 200 and ok.json()["aadhaar_masked"] == "XXXX XXXX 0124"
    assert ok.json()["aadhaar_number_needed"] is False and ok.json()["required_documents"] == []
    async with api.db() as db:
        row = (await db.execute(select(KycSubmission).where(KycSubmission.id == sid))).scalar_one()
    assert row.aadhaar_last4 == "0124" and len(row.aadhaar_hash) == 64 and "234567890124" not in row.aadhaar_hash

    assert (await api.client.post(f"/api/kyc/submissions/{sid}/submit", headers=headers)).status_code == 200
    _, admin = await make_admin(api)
    detail = (await api.client.get(f"/api/admin/kyc/submissions/{sid}", headers=admin)).json()
    assert detail["aadhaar_masked"] == "XXXX XXXX 0124" and detail["aadhaar_used_by_other_account"] is False
    assert {d["document_type"] for d in detail["documents"]} == {"aadhaar_card", "pan_card"}


async def test_one_aadhaar_cannot_be_used_by_two_accounts(api, storage, client_rules):
    first, sid1 = await begin(api)
    assert (await api.client.put(f"/api/kyc/submissions/{sid1}/aadhaar", headers=first, json={"aadhaar_number": VALID})).status_code == 200
    second, sid2 = await begin(api)
    res = await api.client.put(f"/api/kyc/submissions/{sid2}/aadhaar", headers=second, json={"aadhaar_number": VALID.replace(" ", "")})
    assert res.status_code == 409 and res.json()["code"] == "aadhaar_in_use"
    # the same person may re-enter their own number
    assert (await api.client.put(f"/api/kyc/submissions/{sid1}/aadhaar", headers=first, json={"aadhaar_number": VALID})).status_code == 200
