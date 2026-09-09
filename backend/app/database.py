import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "gateway01.ap-southeast-1.prod.aws.tidbcloud.com")
DB_PORT = os.getenv("DB_PORT", "4000")
DB_USER = os.getenv("DB_USER", "3zELpHZez93Ujzn.root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "apuruamf5k1LIp25")
DB_NAME = os.getenv("DB_NAME", "VSM")

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

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
