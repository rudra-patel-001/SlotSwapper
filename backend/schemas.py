from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from .models import EventStatus, SwapStatus # Import enums from models

# --- User Schemas ---

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    
    # orm_mode is deprecated, use from_attributes=True
    class Config:
        from_attributes = True

# --- Auth Schemas ---

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User # Include user data in login/signup response

class TokenData(BaseModel):
    email: Optional[str] = None


# --- Event Schemas ---

class EventBase(BaseModel):
    title: str
    start_time: datetime
    end_time: datetime

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    title: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[EventStatus] = None

class Event(EventBase):
    id: int
    owner_id: int
    status: EventStatus

    class Config:
        from_attributes = True

# Schema for marketplace (Event + owner name)
class MarketplaceSlot(Event):
    owner_name: str


# --- Swap Request Schemas ---

class SwapRequestCreate(BaseModel):
    my_slot_id: int
    their_slot_id: int

class SwapRespond(BaseModel):
    accept: bool

# Schema for detailed swap request info (for lists)
class SwapRequestDetails(BaseModel):
    id: int
    status: SwapStatus
    created_at: datetime
    
    # Requester (who sent it)
    requester_id: int
    requester_name: str
    
    # Responder (who received it)
    responder_id: int
    responder_name: str

    # Slot offered by requester
    my_slot_id: int
    my_slot_title: str
    my_slot_start: datetime
    my_slot_end: datetime

    # Slot owned by responder
    their_slot_id: int
    their_slot_title: str
    their_slot_start: datetime
    their_slot_end: datetime
    
    class Config:
        from_attributes = True