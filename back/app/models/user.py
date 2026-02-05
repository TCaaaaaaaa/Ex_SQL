from sqlalchemy import Column, Integer, String, JSON
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    # Store knowledge map as JSON string for simplicity in this migration
    knowledge_map = Column(JSON, default={})
