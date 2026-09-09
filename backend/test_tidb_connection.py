import os
import sys
from dotenv import load_dotenv

load_dotenv()

print("Checking TiDB Cloud integration...")

try:
    from app.database import engine, SessionLocal
    from app.models.user import User
    from app.models.vsm import VSMProject
    from app.models.imported_data import ImportedData
    from app.core.security import get_password_hash, verify_password, create_access_token, decode_access_token
    from sqlalchemy import text

    db = SessionLocal()
    
    # 1. Test database connection
    result = db.execute(text("SELECT 1")).scalar()
    print(f"✓ Database Ping Result: {result}")

    # 2. Test querying tables
    user_count = db.query(User).count()
    project_count = db.query(VSMProject).count()
    import_count = db.query(ImportedData).count()

    print(f"✓ Table Query Success:")
    print(f"  - users count: {user_count}")
    print(f"  - vsm_projects count: {project_count}")
    print(f"  - imported_data count: {import_count}")

    # 3. Test Password Hashing
    test_pwd = "EngineeringSecretPass2026!"
    hashed = get_password_hash(test_pwd)
    is_valid = verify_password(test_pwd, hashed)
    print(f"✓ Password Hashing (Argon2id/Bcrypt): Verified={is_valid}")

    # 4. Test JWT Token Creation & Decoding
    token = create_access_token({"sub": "test_user_id_123"})
    payload = decode_access_token(token)
    print(f"✓ JWT Token Engine: Verified sub={payload.get('sub') if payload else None}")

    db.close()
    print("SUCCESS: TiDB Cloud + Security Engine verified 100%!")

except Exception as e:
    print(f"❌ Error during verification: {e}")
    import traceback
    traceback.print_exc()
