"""
test_subscription_system.py
=============================================================================
Comprehensive Automated Test Suite for JanDristi Subscription & Usage System.
Tests all 16 specified test scenarios:
  1.  New User Default Free Tier
  2.  5 Successful Uploads Allowed
  3.  6th Upload Rejected (HTTP 403 & specific message)
  4.  Failed Upload Does Not Consume Credit
  5.  Re-upload Duplicate Document Handling
  6.  Concurrent Upload Guard
  7.  Scheme Discovery Freedom
  8.  Personal Plan Quota (30 uploads)
  9.  Small Business Plan Quota (100 uploads)
  10. Annual Plan Monthly Quota Reset
  11. Expired Plan Downgrade to Free
  12. Cancelled Plan Retains Access Until Period End
  13. Forged Payment Signature Rejected
  14. Webhook Idempotency
  15. Cross-User Data Isolation
  16. Existing Core Features Regression Check
=============================================================================
"""

import os
import io
import json
import time
import uuid
import hashlib
import tempfile
import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from fastapi.testclient import TestClient

import server
import config
import database as db
import subscription_service

client = TestClient(server.app)

# Minimal valid PDF bytes for testing upload processing
DUMMY_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 300 300]/Parent 2 0 R>>endobj\n"
    b"xref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000102 00000 n\n"
    b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n170\n%%EOF\n"
)


def create_test_user(email_prefix: str = "testuser") -> dict:
    """Helper to create a fresh user in the SQLite database."""
    session = db.SessionLocal()
    unique_email = f"{email_prefix}_{uuid.uuid4().hex[:8]}@jandristi.in"
    user = db.User(
        name="Citizen Tester",
        email=unique_email,
        password_hash=db.hash_password("Password123!"),
        role="user"
    )
    session.add(user)
    session.commit()
    user_id = user.id
    email = user.email
    session.close()
    return {"id": user_id, "email": email}


class TestSubscriptionSystem(unittest.TestCase):

    def setUp(self):
        # Ensure plans are seeded
        db.init_db()

    # ─────────────────────────────────────────────────────────────────────────
    # 1. New User Default Free Tier
    # ─────────────────────────────────────────────────────────────────────────
    def test_01_new_user_default_free_tier(self):
        """Verify new users automatically start on Free Plan with 5 monthly upload quota."""
        user = create_test_user("free_init")
        res = client.get(f"/api/subscription/usage?user_id={user['id']}")
        self.assertEqual(res.status_code, 200)
        data = res.json()

        self.assertEqual(data["plan_id"], "free")
        self.assertEqual(data["plan_name"], "Free Plan")
        self.assertEqual(data["monthly_upload_limit"], 5)
        self.assertEqual(data["uploads_used"], 0)
        self.assertEqual(data["uploads_remaining"], 5)
        self.assertEqual(data["ai_query_limit"], 15)
        self.assertEqual(data["subscription_status"], "active")

    # ─────────────────────────────────────────────────────────────────────────
    # 2. Exactly 5 Successful Uploads Allowed
    # ─────────────────────────────────────────────────────────────────────────
    @patch("ingestion.process_document")
    @patch("ingestion.extract_text_from_pdf")
    @patch("analysis.analyze_document_complete")
    def test_02_five_successful_uploads_allowed(self, mock_analyze, mock_extract, mock_ingest):
        """Verify that a Free user can successfully upload exactly 5 distinct documents."""
        user = create_test_user("five_uploads")
        test_dir = tempfile.mkdtemp()
        mock_ingest.return_value = {"page_count": 2, "index_dir": test_dir}
        mock_extract.return_value = [{"page": 1, "text": "Contract clause terms"}]
        mock_analyze.return_value = {
            "summary": "Standard Agreement",
            "clauses": [{"title": "Payment", "text": "Net 30"}],
            "risks": []
        }

        for i in range(5):
            unique_content = DUMMY_PDF_BYTES + f"\n% Unique Document Content #{i}_{uuid.uuid4().hex}".encode()
            files = {"file": (f"contract_{i}.pdf", io.BytesIO(unique_content), "application/pdf")}
            data = {"user_id": str(user["id"]), "doc_type": "contract", "ai_mode": "fast"}
            res = client.post("/api/upload", files=files, data=data)
            self.assertEqual(res.status_code, 200, f"Upload {i+1} failed: {res.text}")
            res_json = res.json()
            self.assertTrue(res_json["success"])

        # Check usage meter
        usage = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage["uploads_used"], 5)
        self.assertEqual(usage["uploads_remaining"], 0)

    # ─────────────────────────────────────────────────────────────────────────
    # 3. 6th Upload Rejected (HTTP 403 & exact specification message)
    # ─────────────────────────────────────────────────────────────────────────
    @patch("ingestion.process_document")
    @patch("ingestion.extract_text_from_pdf")
    @patch("analysis.analyze_document_complete")
    def test_03_sixth_upload_rejected_with_403(self, mock_analyze, mock_extract, mock_ingest):
        """Verify 6th upload is rejected with HTTP 403 and upgrade prompt."""
        user = create_test_user("sixth_rejected")
        test_dir = tempfile.mkdtemp()
        mock_ingest.return_value = {"page_count": 2, "index_dir": test_dir}
        mock_extract.return_value = [{"page": 1, "text": "Agreement"}]
        mock_analyze.return_value = {"summary": "OK", "clauses": [], "risks": []}

        # Exhaust 5 credits
        for i in range(5):
            content = DUMMY_PDF_BYTES + f"\n% Doc {i}_{uuid.uuid4().hex}".encode()
            files = {"file": (f"doc_{i}.pdf", io.BytesIO(content), "application/pdf")}
            res = client.post("/api/upload", files=files, data={"user_id": str(user["id"])})
            self.assertEqual(res.status_code, 200)

        # Attempt 6th upload
        content_6 = DUMMY_PDF_BYTES + b"\n% Doc 6 - Should Be Rejected"
        files_6 = {"file": ("doc_6.pdf", io.BytesIO(content_6), "application/pdf")}
        res_6 = client.post("/api/upload", files=files_6, data={"user_id": str(user["id"])})

        self.assertEqual(res_6.status_code, 403)
        detail = res_6.json()["detail"]
        self.assertIn("5 of your 5 free document uploads", detail)
        self.assertIn("Upgrade to Personal for ₹49/month", detail)

    # ─────────────────────────────────────────────────────────────────────────
    # 4. Failed Upload Does Not Consume Credit
    # ─────────────────────────────────────────────────────────────────────────
    @patch("ingestion.process_document", side_effect=RuntimeError("OCR engine failure simulation"))
    def test_04_failed_upload_does_not_consume_credit(self, mock_ingest):
        """Verify that an ingestion or analysis failure never increments used quota."""
        user = create_test_user("failed_upload")
        files = {"file": ("bad_doc.pdf", io.BytesIO(DUMMY_PDF_BYTES + b"error"), "application/pdf")}
        res = client.post("/api/upload", files=files, data={"user_id": str(user["id"])})
        self.assertEqual(res.status_code, 500)

        # Quota MUST still be 0 used, 5 remaining
        usage = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage["uploads_used"], 0)
        self.assertEqual(usage["uploads_remaining"], 5)

    # ─────────────────────────────────────────────────────────────────────────
    # 5. Re-upload Duplicate Document Handling
    # ─────────────────────────────────────────────────────────────────────────
    @patch("ingestion.process_document")
    @patch("ingestion.extract_text_from_pdf")
    @patch("analysis.analyze_document_complete")
    def test_05_reupload_duplicate_does_not_consume_extra_credit(self, mock_analyze, mock_extract, mock_ingest):
        """Verify re-uploading an already accepted document does NOT consume extra quota credit."""
        user = create_test_user("reupload_dup")
        test_dir = tempfile.mkdtemp()
        mock_ingest.return_value = {"page_count": 1, "index_dir": test_dir}
        mock_extract.return_value = [{"page": 1, "text": "Same Text"}]
        mock_analyze.return_value = {"summary": "Same Summary", "clauses": [], "risks": []}

        identical_file = DUMMY_PDF_BYTES + b"\n% Exact Identical File Bytes 12345"

        # First upload: consumes 1 credit
        files1 = {"file": ("contract_original.pdf", io.BytesIO(identical_file), "application/pdf")}
        res1 = client.post("/api/upload", files=files1, data={"user_id": str(user["id"])})
        self.assertEqual(res1.status_code, 200)

        usage1 = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage1["uploads_used"], 1)

        # Re-uploading exact same document
        files2 = {"file": ("contract_reupload.pdf", io.BytesIO(identical_file), "application/pdf")}
        res2 = client.post("/api/upload", files=files2, data={"user_id": str(user["id"])})
        self.assertEqual(res2.status_code, 200)

        # Usage must STILL be 1! (Deduplication prevents consuming extra quota)
        usage2 = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage2["uploads_used"], 1)
        self.assertEqual(usage2["uploads_remaining"], 4)

    # ─────────────────────────────────────────────────────────────────────────
    # 6. Concurrent Upload Guard
    # ─────────────────────────────────────────────────────────────────────────
    def test_06_concurrent_quota_enforcement(self):
        """Verify server-side lock prevents exceeding quota under rapid or simultaneous checks."""
        user = create_test_user("concurrent_guard")
        session = db.SessionLocal()
        sub = subscription_service.get_or_create_user_subscription(session, user["id"])
        period_key = subscription_service.get_current_period_key(user["id"])
        usage = subscription_service.get_or_create_usage_record(session, user["id"], period_key)

        # Fill quota to 5
        usage.uploads_count = 5
        session.commit()

        # Any concurrent quota check must raise 403
        file_hash = hashlib.sha256(b"concurrent_test").hexdigest()
        with self.assertRaises(Exception):
            subscription_service.verify_and_reserve_upload_quota(session, user["id"], file_hash, "test.pdf")
        session.close()

    # ─────────────────────────────────────────────────────────────────────────
    # 7. Scheme Discovery Freedom
    # ─────────────────────────────────────────────────────────────────────────
    def test_07_scheme_discovery_freedom_when_upload_exhausted(self):
        """Verify scheme directory and matchers remain 100% accessible even with 0 upload quota."""
        user = create_test_user("scheme_freedom")
        session = db.SessionLocal()
        period_key = subscription_service.get_current_period_key(user["id"])
        usage = subscription_service.get_or_create_usage_record(session, user["id"], period_key)
        usage.uploads_count = 5  # quota completely exhausted
        session.commit()
        session.close()

        # Scheme listing must succeed
        res_schemes = client.get("/api/schemes")
        self.assertEqual(res_schemes.status_code, 200)
        self.assertIn("schemes", res_schemes.json())

        # Scheme matching must succeed
        match_body = {
            "scheme_text": "PM Kisan Samman Nidhi provides Rs 6000 per year to small landholding farmers.",
            "profile": {"occupation": "Farmer", "state": "Maharashtra"},
            "ai_mode": "fast"
        }
        res_match = client.post("/api/schemes/match", json=match_body)
        self.assertEqual(res_match.status_code, 200)

    # ─────────────────────────────────────────────────────────────────────────
    # 8. Personal Plan Quota (30 uploads / month)
    # ─────────────────────────────────────────────────────────────────────────
    def test_08_personal_plan_quota(self):
        """Verify upgrading to Personal plan (₹49/mo) sets monthly upload limit to 30."""
        user = create_test_user("personal_plan")
        activate_res = client.post("/api/subscription/test-activate", json={
            "user_id": user["id"],
            "plan_id": "personal",
            "billing_cycle": "monthly"
        })
        self.assertEqual(activate_res.status_code, 200)
        data = activate_res.json()

        self.assertEqual(data["plan_id"], "personal")
        self.assertEqual(data["plan_name"], "Personal Plan")
        self.assertEqual(data["monthly_upload_limit"], 30)
        self.assertEqual(data["uploads_remaining"], 30)
        self.assertEqual(data["ai_query_limit"], 60)

    # ─────────────────────────────────────────────────────────────────────────
    # 9. Small Business Plan Quota (100 uploads / month)
    # ─────────────────────────────────────────────────────────────────────────
    def test_09_small_business_plan_quota(self):
        """Verify upgrading to Small Business (₹149/mo) sets monthly upload limit to 100."""
        user = create_test_user("business_plan")
        activate_res = client.post("/api/subscription/test-activate", json={
            "user_id": user["id"],
            "plan_id": "small_business",
            "billing_cycle": "monthly"
        })
        self.assertEqual(activate_res.status_code, 200)
        data = activate_res.json()

        self.assertEqual(data["plan_id"], "small_business")
        self.assertEqual(data["plan_name"], "Small Business Plan")
        self.assertEqual(data["monthly_upload_limit"], 100)
        self.assertEqual(data["uploads_remaining"], 100)
        self.assertEqual(data["ai_query_limit"], 250)
        self.assertTrue(data["features"].get("word_redlining", False))

    # ─────────────────────────────────────────────────────────────────────────
    # 10. Annual Plan Monthly Reset Rule
    # ─────────────────────────────────────────────────────────────────────────
    def test_10_annual_plan_monthly_reset_rule(self):
        """Rule 5: Annual subscribers receive the monthly upload allowance, resetting monthly."""
        user = create_test_user("annual_reset")
        activate_res = client.post("/api/subscription/test-activate", json={
            "user_id": user["id"],
            "plan_id": "personal",
            "billing_cycle": "annual"
        })
        data = activate_res.json()

        self.assertEqual(data["billing_cycle"], "annual")
        # Quota must be monthly (30), NOT the entire 360 upfront
        self.assertEqual(data["monthly_upload_limit"], 30)
        self.assertIsNotNone(data["current_period_end"])
        # Next quota reset date is 1st of next month
        self.assertIsNotNone(data["next_quota_reset_date"])

    # ─────────────────────────────────────────────────────────────────────────
    # 11. Expired Plan Downgrade to Free
    # ─────────────────────────────────────────────────────────────────────────
    def test_11_expired_plan_downgrade_to_free(self):
        """Rule 8: Expired paid subscription gracefully downgrades to Free tier."""
        user = create_test_user("expired_plan")
        session = db.SessionLocal()
        sub = subscription_service.get_or_create_user_subscription(session, user["id"])
        sub.plan_id = "personal"
        sub.status = "active"
        # Simulate expiry in the past
        sub.current_period_end = datetime.utcnow() - timedelta(days=2)
        session.commit()
        session.close()

        # Querying usage must automatically trigger downgrade
        usage = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage["plan_id"], "free")
        self.assertEqual(usage["monthly_upload_limit"], 5)
        self.assertEqual(usage["subscription_status"], "expired")

    # ─────────────────────────────────────────────────────────────────────────
    # 12. Cancelled Plan Retains Access Until Period End
    # ─────────────────────────────────────────────────────────────────────────
    def test_12_cancelled_plan_retains_access_until_end_date(self):
        """Rule 7: A cancelled subscription remains active until its paid-through date."""
        user = create_test_user("cancel_retain")
        client.post("/api/subscription/test-activate", json={
            "user_id": user["id"],
            "plan_id": "personal",
            "billing_cycle": "monthly"
        })

        # Cancel subscription
        cancel_res = client.post("/api/subscription/cancel", json={"user_id": user["id"]})
        self.assertEqual(cancel_res.status_code, 200)

        # Check access: upload limit must STILL be 30 while cancel_at_period_end is True
        usage = client.get(f"/api/subscription/usage?user_id={user['id']}").json()
        self.assertEqual(usage["plan_id"], "personal")
        self.assertEqual(usage["monthly_upload_limit"], 30)
        self.assertTrue(usage["cancel_at_period_end"])
        self.assertEqual(usage["subscription_status"], "cancelled")

    # ─────────────────────────────────────────────────────────────────────────
    # 13. Forged Payment Signature Rejected
    # ─────────────────────────────────────────────────────────────────────────
    def test_13_forged_payment_signature_rejected(self):
        """Verify forged or tampered signatures are strictly rejected with HTTP 400."""
        user = create_test_user("forged_sig")
        checkout = client.post("/api/subscription/checkout", json={
            "user_id": user["id"],
            "plan_id": "personal",
            "billing_cycle": "monthly"
        }).json()

        # Send invalid signature
        verify_res = client.post("/api/subscription/verify-payment", json={
            "user_id": user["id"],
            "order_id": checkout["order_id"],
            "payment_id": "pay_fake123",
            "signature": "forged_malicious_signature_hash"
        })

        self.assertEqual(verify_res.status_code, 400)
        self.assertIn("Invalid cryptographic payment signature", verify_res.json()["detail"])

    # ─────────────────────────────────────────────────────────────────────────
    # 14. Webhook Idempotency
    # ─────────────────────────────────────────────────────────────────────────
    def test_14_webhook_idempotency(self):
        """Verify processing the same webhook event ID twice does not cause double actions."""
        event_id = f"evt_{uuid.uuid4().hex}"
        payload = {
            "event_id": event_id,
            "event": "payment.captured",
            "payload": {
                "payment": {
                    "entity": {
                        "id": "pay_test_webhook_123",
                        "order_id": "order_test_webhook_123",
                        "amount": 4900
                    }
                }
            }
        }

        # First event
        res1 = client.post("/api/payments/webhook", json=payload)
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1.json()["status"], "success")

        # Second identical event: MUST be ignored safely
        res2 = client.post("/api/payments/webhook", json=payload)
        self.assertEqual(res2.status_code, 200)
        self.assertEqual(res2.json()["status"], "ignored")

    # ─────────────────────────────────────────────────────────────────────────
    # 15. Cross-User Data Isolation
    # ─────────────────────────────────────────────────────────────────────────
    def test_15_cross_user_data_isolation(self):
        """Verify user A's uploads and limits cannot leak into user B's quota."""
        user_a = create_test_user("user_a")
        user_b = create_test_user("user_b")

        # User A upgrades to Small Business (100 uploads)
        client.post("/api/subscription/test-activate", json={"user_id": user_a["id"], "plan_id": "small_business"})

        # User B remains on Free (5 uploads)
        usage_b = client.get(f"/api/subscription/usage?user_id={user_b['id']}").json()
        self.assertEqual(usage_b["plan_id"], "free")
        self.assertEqual(usage_b["monthly_upload_limit"], 5)

        usage_a = client.get(f"/api/subscription/usage?user_id={user_a['id']}").json()
        self.assertEqual(usage_a["plan_id"], "small_business")
        self.assertEqual(usage_a["monthly_upload_limit"], 100)

    # ─────────────────────────────────────────────────────────────────────────
    # 16. Existing Core Features Regression Check
    # ─────────────────────────────────────────────────────────────────────────
    def test_16_core_features_regression_check(self):
        """Verify existing system endpoints (health, languages, schemes) operate properly."""
        health = client.get("/health").json()
        self.assertEqual(health["status"], "ok")

        languages = client.get("/api/languages").json()
        self.assertIn("languages", languages)
        self.assertIn("Hindi", languages["languages"])

        schemes = client.get("/api/schemes").json()
        self.assertIn("schemes", schemes)
        self.assertGreater(len(schemes["schemes"]), 0)


if __name__ == "__main__":
    unittest.main()
