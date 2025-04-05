from typing import List
from typing import Optional
from sqlalchemy import ForeignKey
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy import func
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import Mapped, sessionmaker
from sqlalchemy.orm import mapped_column
from sqlalchemy.orm import relationship
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
print(DATABASE_URL)
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is not set")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL,     connect_args={"options": "-c statement_timeout=5000"}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class User(Base):
    __tablename__ = "user"

    user_id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255))
    username: Mapped[str] = mapped_column(String(255))
    password: Mapped[str] = mapped_column(String(255))
    first_name: Mapped[str] = mapped_column(String(255))
    last_name: Mapped[str] = mapped_column(String(255))
    last_login: Mapped[datetime] = mapped_column(insert_default=func.now())


class FMRI_History(Base):
    __tablename__ = "fmri_history"

    fmri_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.user_id"))
    date: Mapped[datetime] = mapped_column(insert_default=func.now())
    file_link: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255))
    gender: Mapped[str] = mapped_column(String(255))
    age: Mapped[int] = mapped_column(Integer)
    diagnosis: Mapped[str] = mapped_column(String(255))


# This function is used for direct table creation without migrations
# For schema changes, use Alembic migrations instead
def create_tables():
    Base.metadata.create_all(bind=engine)


# Only create tables directly if this file is run directly
# When using migrations, this won't be executed
if __name__ == "__main__":
    create_tables()
    print("Tables created directly (without migrations)")
else:
    print("Models loaded - use Alembic migrations for schema changes")

# TO USE ALEMBIC:
# alembic revision --autogenerate -m "Description of changes"
# alembic upgrade head


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
