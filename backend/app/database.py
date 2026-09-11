import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "4000")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "VSM")

if DB_HOST and DB_USER and DB_PASSWORD:
    SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    try:
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            connect_args={"ssl": {"ssl_mode": "VERIFY_IDENTITY"}},
            pool_pre_ping=True,
            pool_recycle=3600,
        )
    except Exception:
        # Fallback without ssl_mode if SSL is default on host
        engine = create_engine(
            SQLALCHEMY_DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=3600,
        )
else:
    # Fallback to local SQLite when remote database credentials are not configured (e.g. CI or offline unit testing)
    SQLALCHEMY_DATABASE_URL = "sqlite:///./vsm_studio.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        pool_pre_ping=True,
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
