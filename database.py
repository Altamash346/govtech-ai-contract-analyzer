"""
database.py — SQLite database setup using SQLAlchemy.
Stores: users, uploaded document metadata, Q&A history,
        subscription plans, user subscriptions, usage tracking,
        and payment transactions.
"""
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey, text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import hashlib
import json
import config

engine = create_engine(config.DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user")  # "user" or "admin"
    created_at = Column(DateTime, default=datetime.utcnow)
    profile = Column(Text, nullable=True)  # JSON string of user profile for scheme matching

    documents = relationship("Document", back_populates="owner")
    qa_history = relationship("QAHistory", back_populates="user")
    subscription = relationship("UserSubscription", back_populates="user", uselist=False)
    usage_records = relationship("UsageRecord", back_populates="user")
    transactions = relationship("PaymentTransaction", back_populates="user")


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # "contract" or "scheme"
    page_count = Column(Integer, nullable=True)
    file_hash = Column(String, nullable=True, index=True)  # SHA-256 for duplicate detection
    summary = Column(Text, nullable=True)
    risks = Column(Text, nullable=True)        # JSON string
    clauses = Column(Text, nullable=True)      # JSON string
    entities = Column(Text, nullable=True)     # JSON string
    faiss_index_path = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    owner = relationship("User", back_populates="documents")
    qa_history = relationship("QAHistory", back_populates="document")


class QAHistory(Base):
    __tablename__ = "qa_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    document_id = Column(Integer, ForeignKey("documents.id"))
    question = Column(Text, nullable=False)
    answer = Column(Text, nullable=False)
    citations = Column(Text, nullable=True)  # JSON string of page citations
    asked_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="qa_history")
    document = relationship("Document", back_populates="qa_history")


# ─── Subscription & Billing Models ───────────────────────────────────────────

class SubscriptionPlan(Base):
    __tablename__ = "subscription_plans"
    id = Column(String, primary_key=True)  # "free", "personal", "small_business"
    display_name = Column(String, nullable=False)
    monthly_price_inr = Column(Integer, default=0)
    annual_price_inr = Column(Integer, default=0)
    monthly_upload_limit = Column(Integer, default=5)
    ai_query_limit = Column(Integer, default=15)
    features_json = Column(Text, nullable=True)
    is_active = Column(Integer, default=1)

    subscriptions = relationship("UserSubscription", back_populates="plan")


class UserSubscription(Base):
    __tablename__ = "user_subscriptions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True, nullable=False)
    plan_id = Column(String, ForeignKey("subscription_plans.id"), default="free", nullable=False)
    billing_cycle = Column(String, default="monthly")  # "monthly" or "annual"
    status = Column(String, default="active")  # "active", "cancelled", "expired"
    current_period_start = Column(DateTime, default=datetime.utcnow)
    current_period_end = Column(DateTime, nullable=True)  # None for free tier (indefinite)
    cancel_at_period_end = Column(Integer, default=0)  # 1 if scheduled to cancel at end of cycle
    payment_status = Column(String, default="none")  # "none", "paid", "pending", "failed", "refunded"
    razorpay_subscription_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="subscription")
    plan = relationship("SubscriptionPlan", back_populates="subscriptions")


class UsageRecord(Base):
    __tablename__ = "usage_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    period_key = Column(String, index=True, nullable=False)  # "YYYY-MM" or billing cycle key
    uploads_count = Column(Integer, default=0)
    ai_queries_count = Column(Integer, default=0)
    last_upload_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="usage_records")


class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    order_id = Column(String, unique=True, index=True, nullable=False)
    payment_id = Column(String, unique=True, nullable=True)
    signature = Column(String, nullable=True)
    amount_inr = Column(Integer, nullable=False)
    currency = Column(String, default="INR")
    plan_id = Column(String, nullable=False)
    billing_cycle = Column(String, default="monthly")  # "monthly" or "annual"
    status = Column(String, default="created")  # "created", "paid", "failed", "refunded"
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="transactions")


class PaymentWebhookEvent(Base):
    __tablename__ = "payment_webhook_events"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, unique=True, index=True, nullable=False)
    event_type = Column(String, nullable=False)
    payload_json = Column(Text, nullable=False)
    status = Column(String, default="processed")  # "processed", "failed", "ignored"
    created_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    """Create all tables in the database and seed initial subscription plans."""
    Base.metadata.create_all(bind=engine)

    # Safe migration: ensure file_hash column exists on documents table if created earlier
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN file_hash VARCHAR"))
            conn.commit()
    except Exception:
        pass  # Column already exists

    # Seed default plans if empty
    session = SessionLocal()
    try:
        existing_plans = session.query(SubscriptionPlan).count()
        if existing_plans == 0:
            free_plan = SubscriptionPlan(
                id="free",
                display_name="Free Plan",
                monthly_price_inr=0,
                annual_price_inr=0,
                monthly_upload_limit=config.FREE_MONTHLY_UPLOADS,
                ai_query_limit=config.FREE_AI_QUERY_LIMIT,
                features_json=json.dumps({
                    "upload_limit_label": f"{config.FREE_MONTHLY_UPLOADS} monthly",
                    "scheme_discovery": True,
                    "contract_analysis": "Basic",
                    "ai_qa": "Limited",
                    "page_citations": "Basic availability",
                    "audit_reports": "Limited",
                    "advanced_clause_analysis": "Limited",
                    "word_redlining": False,
                    "workflow": "Basic"
                })
            )
            personal_plan = SubscriptionPlan(
                id="personal",
                display_name="Personal Plan",
                monthly_price_inr=config.PERSONAL_MONTHLY_PRICE,
                annual_price_inr=config.PERSONAL_ANNUAL_PRICE,
                monthly_upload_limit=config.PERSONAL_MONTHLY_UPLOADS,
                ai_query_limit=config.PERSONAL_AI_QUERY_LIMIT,
                features_json=json.dumps({
                    "upload_limit_label": f"{config.PERSONAL_MONTHLY_UPLOADS}/month",
                    "scheme_discovery": True,
                    "contract_analysis": "Yes",
                    "ai_qa": "Yes",
                    "page_citations": "Yes",
                    "audit_reports": "Yes",
                    "advanced_clause_analysis": "Yes",
                    "word_redlining": False,
                    "workflow": "Standard"
                })
            )
            business_plan = SubscriptionPlan(
                id="small_business",
                display_name="Small Business Plan",
                monthly_price_inr=config.BUSINESS_MONTHLY_PRICE,
                annual_price_inr=config.BUSINESS_ANNUAL_PRICE,
                monthly_upload_limit=config.BUSINESS_MONTHLY_UPLOADS,
                ai_query_limit=config.BUSINESS_AI_QUERY_LIMIT,
                features_json=json.dumps({
                    "upload_limit_label": f"{config.BUSINESS_MONTHLY_UPLOADS}/month",
                    "scheme_discovery": True,
                    "contract_analysis": "Yes",
                    "ai_qa": "Yes",
                    "page_citations": "Yes",
                    "audit_reports": "Yes",
                    "advanced_clause_analysis": "Yes",
                    "word_redlining": True,
                    "workflow": "Advanced"
                })
            )
            session.add_all([free_plan, personal_plan, business_plan])
            session.commit()
    except Exception as e:
        session.rollback()
        print(f"[database] Plan seeding notice: {e}")
    finally:
        session.close()


def get_db():
    """Dependency to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed
