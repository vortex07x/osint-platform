import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import uuid as uuid_module
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.compiler import compiles

# --- SQLite compatibility shim for Postgres UUID columns ---
# @compiles only fixes DDL (CREATE TABLE column type). We also need to fix
# the Python-side bind/result processing, since it normally assumes a real
# uuid.UUID object and calls .hex directly — but values from FastAPI path
# params / JSON responses arrive as plain strings.

@compiles(PGUUID, "sqlite")
def compile_uuid_sqlite(element, compiler, **kw):
    return "CHAR(32)"

_original_bind_processor = PGUUID.bind_processor
_original_result_processor = PGUUID.result_processor

def _sqlite_safe_bind_processor(self, dialect):
    if dialect.name == "sqlite":
        def process(value):
            if value is None:
                return None
            if isinstance(value, str):
                value = uuid_module.UUID(value)
            return value.hex
        return process
    return _original_bind_processor(self, dialect)

def _sqlite_safe_result_processor(self, dialect, coltype):
    if dialect.name == "sqlite":
        def process(value):
            if value is None:
                return None
            return uuid_module.UUID(value)
        return process
    return _original_result_processor(self, dialect, coltype)

PGUUID.bind_processor = _sqlite_safe_bind_processor
PGUUID.result_processor = _sqlite_safe_result_processor
# --- end shim ---

from db.database import Base, get_db
import main as app_module
from models.users import User
from auth.dependencies import get_current_user

TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def _create_test_schema():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db_session():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def test_user(db_session):
    user = User(
        email="testuser@example.com",
        password_hash="not-a-real-hash",
        full_name="Test User",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture()
def client(db_session, test_user):
    def override_get_db():
        yield db_session

    def override_get_current_user():
        return test_user

    app_module.app.dependency_overrides[get_db] = override_get_db
    app_module.app.dependency_overrides[get_current_user] = override_get_current_user

    with TestClient(app_module.app) as c:
        yield c

    app_module.app.dependency_overrides.clear()