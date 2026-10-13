"""
database.py — SQLite database setup using SQLAlchemy.
Stores: users, uploaded document metadata, and Q&A history.
"""
from sqlalchemy import create_engine, Column, String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import hashlib
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


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    filename = Column(String, nullable=False)
    doc_type = Column(String, nullable=False)  # "contract" or "scheme"
    page_count = Column(Integer, nullable=True)
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


def init_db():
    """Create all tables in the database and ensure demo accounts exist."""
    Base.metadata.create_all(bind=engine)
    session = SessionLocal()
    demo_users = [
        {"name": "bbb", "email": "bbb@gmail.com", "password": "123"},
        {"name": "meet", "email": "meet@gmail.com", "password": "123"},
        {"name": "aaa", "email": "aaa@gmail.com", "password": "123"}
    ]
    try:
        for du in demo_users:
            u = session.query(User).filter_by(email=du["email"]).first()
            if not u:
                session.add(User(name=du["name"], email=du["email"], password_hash=hash_password(du["password"])))
            else:
                u.password_hash = hash_password(du["password"])
        session.commit()
    except Exception as e:
        session.rollback()
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
