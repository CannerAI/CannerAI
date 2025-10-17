from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime


class ResponseBase(BaseModel):
    """Base response schema with common fields"""
    title: str = Field(..., min_length=1, max_length=255, description="Short title for the response template")
    content: str = Field(..., min_length=1, description="The full text content of the response")
    tags: List[str] = Field(default=[], description="Array of tags for categorizing the response")

    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags are clean and non-empty"""
        return [tag.strip() for tag in v if tag.strip()]


class ResponseCreate(ResponseBase):
    """Schema for creating a new response"""
    pass


class ResponseUpdate(BaseModel):
    """Schema for updating a response (all fields optional)"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    tags: Optional[List[str]] = None

    @validator('tags')
    def validate_tags(cls, v):
        """Ensure tags are clean and non-empty"""
        if v is not None:
            return [tag.strip() for tag in v if tag.strip()]
        return v


class ResponseResponse(ResponseBase):
    """Schema for response output"""
    id: str = Field(..., description="Unique identifier for the response")
    created_at: datetime = Field(..., description="Timestamp when the response was created")
    updated_at: datetime = Field(..., description="Timestamp when the response was last updated")
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "title": "Connection Request - Developer",
                "content": "Hi! I'd like to connect with you. I'm a software developer with 5 years of experience.",
                "tags": ["connection", "developer", "networking"],
                "created_at": "2025-01-15T10:30:00Z",
                "updated_at": "2025-01-15T10:30:00Z"
            }
        }


class HealthResponse(BaseModel):
    """Health check response schema"""
    status: str
    timestamp: datetime
    database: str
    database_connected: bool
    error: Optional[str] = None


class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str
    detail: Optional[str] = None
    detail: Optional[str] = None