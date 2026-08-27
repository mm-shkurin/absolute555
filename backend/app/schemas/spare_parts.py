from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from uuid import UUID

class SparePartsCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    mileage_last_replaced: int = Field(..., gt=0)
    mileage_average_value: Optional[int] = Field(None, ge=0)

class SparePartsUpdate(BaseModel):
    input_mileage: int = Field(..., gt=0)
    mileage_average_value: Optional[int] = Field(None, ge=0)

class SparePartsResponse(BaseModel):
    part_id: UUID
    car_id: UUID
    user_id: UUID
    name: str
    mileage_last_replaced: Optional[int]
    array_mileage: List[int]
    mileage_average_value: Optional[int]
    chroma_document_id: Optional[str]
    task_id: Optional[str]
    task_status: Optional[str]
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    latest_mileage: int
    mileage_count: int
    
    class Config:
        from_attributes = True

class GigachatPredictionResponse(BaseModel):
    predicted_replacement_mileage: int
    estimated_replacement_date: str
    part_recommendation: str
    estimated_cost: float

class PredictionRequest(BaseModel):
    car_id: UUID
    part_id: UUID
    current_mileage: int = Field(..., gt=0)
    mileage_average_value: Optional[int] = Field(None, ge=0)

class PredictionResponse(BaseModel):
    part_name: str
    current_mileage: int
    mileage_last_replaced: Optional[int]
    array_mileage: List[int]
    mileage_average_value: Optional[int]
    
    gigachat_prediction: GigachatPredictionResponse
    
    remaining_km: int
    remaining_weeks: Optional[int]
    notification_needed: bool

class SparePartsCreateResponse(BaseModel):
    spare_part: SparePartsResponse
    task_id: str
    task_status: str
    message: str

class SparePartsDetailsResponse(BaseModel):
    spare_part: SparePartsResponse
    gigachat_prediction: Optional[Dict[str, Any]]
    mileage_calculations: Optional[Dict[str, Any]]