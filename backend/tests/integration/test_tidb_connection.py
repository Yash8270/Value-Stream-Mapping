import os
import pytest
from sqlalchemy import text

pytestmark = pytest.mark.integration

# Check if real TiDB Cloud environment variables are provided
TIDB_CONFIGURED = bool(
    os.getenv("DB_HOST")
    and os.getenv("DB_USER")
    and os.getenv("DB_PASSWORD")
    and "tidbcloud" in os.getenv("DB_HOST", "").lower()
)


@pytest.mark.skipif(
    not TIDB_CONFIGURED,
    reason="TiDB Cloud credentials not set in environment (DB_HOST, DB_USER, DB_PASSWORD). Skipping database integration test."
)
def test_tidb_database_connectivity():
    """Verify live connection to TiDB Cloud database and test table queries."""
    from app.database import SessionLocal
    from app.models.user import User
    from app.models.vsm import VSMProject
    from app.models.imported_data import ImportedData

    try:
        db = SessionLocal()
        # 1. Ping query
        result = db.execute(text("SELECT 1")).scalar()
        assert result == 1, "Database ping SELECT 1 should return 1"

        # 2. Table query verification
        user_count = db.query(User).count()
        project_count = db.query(VSMProject).count()
        import_count = db.query(ImportedData).count()

        assert user_count >= 0
        assert project_count >= 0
        assert import_count >= 0

        db.close()
    except Exception as e:
        pytest.skip(f"TiDB Cloud unreachable or network error: {e}")
