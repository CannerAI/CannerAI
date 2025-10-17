from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database.connection import get_database
from services.response_service import ResponseService
from api.models import ResponseResponse, ResponseCreate, ResponseUpdate, ErrorResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/responses",
    tags=["responses"],
    responses={404: {"model": ErrorResponse}}
)


def get_response_service(db: Session = Depends(get_database)) -> ResponseService:
    """Dependency to get response service"""
    return ResponseService(db)


@router.get(
    "/",
    response_model=List[ResponseResponse],
    summary="Get all responses",
    description="Retrieve all canned responses with optional search functionality"
)
async def get_responses(
    search: Optional[str] = Query(None, description="Search term to filter responses"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of responses to return"),
    response_service: ResponseService = Depends(get_response_service)
):
    """Get all responses with optional search"""
    try:
        responses = response_service.get_responses(search=search, limit=limit)
        response_data = [ResponseResponse.from_orm(response) for response in responses]
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve responses: {str(e)}")


@router.get(
    "/{response_id}",
    response_model=ResponseResponse,
    summary="Get a specific response",
    description="Retrieve a single canned response by its ID"
)
async def get_response(
    response_id: str,
    response_service: ResponseService = Depends(get_response_service)
):
    """Get a single response by ID"""
    response = response_service.get_response_by_id(response_id)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    return ResponseResponse.from_orm(response)


@router.post(
    "/",
    response_model=ResponseResponse,
    status_code=201,
    summary="Create a new response",
    description="Create a new canned response template"
)
async def create_response(
    response_data: ResponseCreate,
    response_service: ResponseService = Depends(get_response_service)
):
    """Create a new response"""
    try:
        response = response_service.create_response(response_data)
        result = ResponseResponse.from_orm(response)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create response: {str(e)}")


@router.put(
    "/{response_id}",
    response_model=ResponseResponse,
    summary="Update a response",
    description="Update an existing canned response"
)
async def update_response(
    response_id: str,
    response_data: ResponseUpdate,
    response_service: ResponseService = Depends(get_response_service)
):
    """Update an existing response"""
    response = response_service.update_response(response_id, response_data)
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")
    
    return ResponseResponse.from_orm(response)


@router.delete(
    "/{response_id}",
    status_code=204,
    summary="Delete a response",
    description="Delete a canned response by its ID"
)
async def delete_response(
    response_id: str,
    response_service: ResponseService = Depends(get_response_service)
):
    """Delete a response"""
    success = response_service.delete_response(response_id)
    if not success:
        raise HTTPException(status_code=404, detail="Response not found")


@router.get(
    "/tags/",
    response_model=List[str],
    summary="Get all tags",
    description="Retrieve all unique tags used across responses"
)
async def get_tags(
    response_service: ResponseService = Depends(get_response_service)
):
    """Get all unique tags"""
    try:
        return response_service.get_all_tags()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve tags: {str(e)}")