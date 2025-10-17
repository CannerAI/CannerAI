from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import responses, health
from database.connection import create_tables, DATABASE_URL
import logging
import uvicorn
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Set specific loggers to appropriate levels
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # Reduce uvicorn noise
logging.getLogger("database").setLevel(logging.INFO)
logging.getLogger("services").setLevel(logging.INFO)
logging.getLogger("routes").setLevel(logging.INFO)

# Create FastAPI app
app = FastAPI(
    title="Canner API",
    description="A FastAPI-based backend for managing canned responses for LinkedIn and Twitter",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with clean endpoints
app.include_router(health.router)
app.include_router(responses.router)

@app.on_event("startup")
async def startup_event():
    """Create database tables on startup"""
    logger.info("🚀 Starting up Canner API...")
    logger.info(f"📊 FastAPI Version: {app.version}")
    logger.info(f"🔧 Environment: {os.environ.get('ENVIRONMENT', 'development')}")
    
    # Test database connection
    from database.connection import test_database_connection
    connected, error = test_database_connection()
    
    if connected:
        logger.info("✅ Database connection verified")
        create_tables()
        
        # Log some database stats
        try:
            from database.connection import SessionLocal
            from services.response_service import ResponseService
            db = SessionLocal()
            service = ResponseService(db)
            responses = service.get_responses(limit=1000)
            logger.info(f"📊 Database contains {len(responses)} responses")
            db.close()
        except Exception as e:
            logger.warning(f"⚠️  Could not get database stats: {e}")
            
    else:
        logger.error(f"❌ Database connection failed: {error}")
        raise Exception(f"Cannot start application - database connection failed: {error}")
    
    logger.info("✅ Canner API startup complete!")

@app.get("/", tags=["root"])
async def root():
    """Root endpoint"""
    return {
        "message": "Canner API - FastAPI Version",
        "version": "2.0.0",
        "docs": "/docs",
        "health": "/health"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
