from sqlalchemy import create_engine, Column, Integer, String, DateTime, Boolean, Text, Index, Float

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")

# Configure engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    poolclass=StaticPool if "sqlite" in DATABASE_URL else None,
    pool_pre_ping=True,
    echo=False  # Set to True for SQL debugging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    source_ip = Column(String, index=True)
    message = Column(Text)
    log_type = Column(String, default="generic")  # apache, nginx, syslog, json, etc.
    
    # GeoIP enrichment fields
    country = Column(String, nullable=True)
    country_code = Column(String, nullable=True)
    city = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    timezone = Column(String, nullable=True)
    
    # Additional metadata
    user_agent = Column(String, nullable=True)
    parsed_data = Column(Text, nullable=True)  # JSON string for structured data
    
    # Create composite index for common queries
    __table_args__ = (
        Index('idx_timestamp_ip', 'timestamp', 'source_ip'),
        Index('idx_country_timestamp', 'country', 'timestamp'),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    rule_name = Column(String, index=True)
    severity = Column(String, index=True)  # critical, high, medium, low
    description = Column(Text)
    source_ip = Column(String, index=True)
    
    # Alert acknowledgment
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    
    # Additional metadata
    correlation_id = Column(String, nullable=True)  # For grouping related alerts
    false_positive = Column(Boolean, default=False)
    
    # Create composite indexes
    __table_args__ = (
        Index('idx_severity_timestamp', 'severity', 'timestamp'),
        Index('idx_acknowledged_severity', 'acknowledged', 'severity'),
    )

def init_db():
    """Initialize database and create all tables"""
    Base.metadata.create_all(bind=engine)
    print("[+] Database initialized successfully")

def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

