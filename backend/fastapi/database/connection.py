from http.client import HTTPException
import os
import logging
from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import OperationalError
import time
import psycopg2

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    # Default to SQLite for development
    DATABASE_URL = "sqlite:///./responses.db"
    logger.info("🔧 No DATABASE_URL provided, using SQLite default")
else:
    logger.info(f"🔧 Using DATABASE_URL: {DATABASE_URL}")

# Log database type
db_type = "PostgreSQL" if DATABASE_URL.startswith('postgresql') else "SQLite"
logger.info(f"📊 Database Type: {db_type}")

# Create engine with appropriate settings
try:
    if DATABASE_URL.startswith('postgresql'):
        engine = create_engine(DATABASE_URL)
        logger.info("✅ PostgreSQL engine created successfully")
    else:
        DATABASE_URL = "sqlite:///./responses.db"
        engine = create_engine(
            DATABASE_URL, 
            connect_args={"check_same_thread": False}
        )
        logger.info("✅ Fallback SQLite engine created")
        
except Exception as e:
    logger.error(f"❌ Database engine creation failed: {e}, falling back to SQLite")
    DATABASE_URL = "sqlite:///./responses.db"
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
    logger.info("✅ Emergency fallback SQLite engine created")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_database():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {e}")
    finally:
        db.close()
        logger.debug("🔒 Database session closed")

def create_tables():
    """Create all tables"""
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create tables: {e}")

def test_database_connection():
    """Test database connectivity with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    logger.info(f"🔍 Testing database connection to: {DATABASE_URL.split('@')[0]}@***")
    
    for attempt in range(max_retries):
        try:
            logger.info(f"🔄 Connection attempt {attempt + 1}/{max_retries}")
            db = SessionLocal()
            db.execute(text("SELECT 1"))
            db.close()
            return True, None
        except OperationalError as e:
            logger.warning(f"⚠️  Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                logger.info(f"⏳ Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                return False, str(e)
            
    return False, "Maximum retries exceeded"