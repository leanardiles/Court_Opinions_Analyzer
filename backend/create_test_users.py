"""
Create test users for development
"""

from app.database import SessionLocal, engine
from app.models import Base, User, UserRole
from app.utils.auth import hash_password


# Create tables first (in case they don't exist)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Check if users already exist
existing_admin = db.query(User).filter(User.email == "admin@cardozo.edu").first()

if existing_admin:
    print("✅ Users already exist!")
    db.close()
    exit()

print("Creating test users...")

# Create test users with exact credentials from your screenshot
users = [
    # Admin
    User(
        email="admin@cardozo.edu",
        hashed_password=hash_password("admin12345"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    ),
    # Scholar
    User(
        email="scholar1@cardozo.edu",
        hashed_password=hash_password("scholar123"),
        full_name="Professor Smith",
        role=UserRole.SCHOLAR,
        is_active=True
    ),
    # Validators
    User(
        email="ta1@cardozo.edu",
        hashed_password=hash_password("validator123"),
        full_name="TA Johnson",
        role=UserRole.VALIDATOR,
        is_active=True
    ),
    User(
        email="ta2@cardozo.edu",
        hashed_password=hash_password("validator123"),
        full_name="TA Williams",
        role=UserRole.VALIDATOR,
        is_active=True
    )
]

# Add all users
for user in users:
    db.add(user)

db.commit()

print("\n✅ Test users created successfully!\n")
print("Test Accounts:")
print("=" * 50)
print("Admin:")
print("  Email:    admin@cardozo.edu")
print("  Password: admin12345")
print()
print("Scholar:")
print("  Email:    scholar1@cardozo.edu")
print("  Password: scholar123")
print()
print("Validators:")
print("  TA1:")
print("    Email:    ta1@cardozo.edu")
print("    Password: validator123")
print("  TA2:")
print("    Email:    ta2@cardozo.edu")
print("    Password: validator123")
print("=" * 50)

db.close()