from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from . import models, schemas, auth
from fastapi import HTTPException, status
from typing import List

# --- User CRUD ---

def get_user(db: Session, user_id: int) -> models.User:
    """Get a single user by ID."""
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> models.User:
    """Get a single user by email."""
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """Create a new user."""
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- Event CRUD ---

def get_events_by_user(db: Session, user_id: int) -> List[models.Event]:
    """Get all events for a specific user."""
    return db.query(models.Event).filter(
        models.Event.owner_id == user_id
    ).order_by(models.Event.start_time).all()

def get_event(db: Session, event_id: int) -> models.Event:
    """Get a single event by its ID."""
    return db.query(models.Event).filter(models.Event.id == event_id).first()

def create_event(db: Session, event: schemas.EventCreate, user_id: int) -> models.Event:
    """Create a new event for a user."""
    db_event = models.Event(**event.model_dump(), owner_id=user_id)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def update_event(
    db: Session, 
    event_id: int, 
    event_data: schemas.EventUpdate, 
    user_id: int
) -> models.Event:
    """Update an event's details."""
    db_event = get_event(db, event_id)
    
    if not db_event:
        return None
    if db_event.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to update this event"
        )
    
    update_data = event_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_event, key, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int, user_id: int) -> models.Event:
    """Delete an event."""
    db_event = get_event(db, event_id)
    
    if not db_event:
        return None
    if db_event.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Not authorized to delete this event"
        )
    
    db.delete(db_event)
    db.commit()
    return db_event

# --- Marketplace CRUD ---

def get_marketplace_slots(db: Session, user_id: int) -> List[schemas.MarketplaceSlot]:
    """Get all events from *other* users that are SWAPPABLE."""
    slots = db.query(models.Event).join(models.User).filter(
        models.Event.status == models.EventStatus.SWAPPABLE,
        models.Event.owner_id != user_id
    ).options(joinedload(models.Event.owner)).all()
    
    # Manually construct the response to include owner_name
    return [
        schemas.MarketplaceSlot(
            **event.__dict__,
            owner_name=event.owner.name
        ) for event in slots
    ]

# --- Swap Request CRUD ---

def create_swap_request(
    db: Session, 
    request_data: schemas.SwapRequestCreate, 
    requester_id: int
) -> models.SwapRequest:
    """Create a new swap request."""
    
    my_slot = get_event(db, request_data.my_slot_id)
    their_slot = get_event(db, request_data.their_slot_id)

    # Validations
    if not my_slot or not their_slot:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot not found")
    if my_slot.owner_id != requester_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Cannot trade slot you don't own")
    if their_slot.owner_id == requester_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot trade with yourself")
    if their_slot.status != models.EventStatus.SWAPPABLE:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Target slot is not swappable")
    
    # Create the request
    db_request = models.SwapRequest(
        requester_id=requester_id,
        responder_id=their_slot.owner_id,
        my_slot_id=my_slot.id,
        their_slot_id=their_slot.id,
        status=models.SwapStatus.PENDING
    )
    
    # Set both slots to SWAP_PENDING
    my_slot.status = models.EventStatus.SWAP_PENDING
    their_slot.status = models.EventStatus.SWAP_PENDING
    
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

def _get_swap_request_details(db: Session, query) -> List[schemas.SwapRequestDetails]:
    """Helper to format swap request responses."""
    requests = query.all()
    results = []
    for req in requests:
        results.append(schemas.SwapRequestDetails(
            id=req.id,
            status=req.status,
            created_at=req.created_at,
            requester_id=req.requester.id,
            requester_name=req.requester.name,
            responder_id=req.responder.id,
            responder_name=req.responder.name,
            my_slot_id=req.my_slot.id,
            my_slot_title=req.my_slot.title,
            my_slot_start=req.my_slot.start_time,
            my_slot_end=req.my_slot.end_time,
            their_slot_id=req.their_slot.id,
            their_slot_title=req.their_slot.title,
            their_slot_start=req.their_slot.start_time,
            their_slot_end=req.their_slot.end_time,
        ))
    return results

def get_incoming_requests(db: Session, user_id: int) -> List[schemas.SwapRequestDetails]:
    """Get all swap requests sent *to* the user."""
    query = db.query(models.SwapRequest).filter(
        models.SwapRequest.responder_id == user_id
    ).options(
        joinedload(models.SwapRequest.requester),
        joinedload(models.SwapRequest.responder),
        joinedload(models.SwapRequest.my_slot),
        joinedload(models.SwapRequest.their_slot)
    ).order_by(models.SwapRequest.created_at.desc())
    
    return _get_swap_request_details(db, query)

def get_outgoing_requests(db: Session, user_id: int) -> List[schemas.SwapRequestDetails]:
    """Get all swap requests sent *by* the user."""
    query = db.query(models.SwapRequest).filter(
        models.SwapRequest.requester_id == user_id
    ).options(
        joinedload(models.SwapRequest.requester),
        joinedload(models.SwapRequest.responder),
        joinedload(models.SwapRequest.my_slot),
        joinedload(models.SwapRequest.their_slot)
    ).order_by(models.SwapRequest.created_at.desc())
    
    return _get_swap_request_details(db, query)

def get_swap_request(db: Session, request_id: int) -> models.SwapRequest:
    """Get a single swap request by ID."""
    return db.query(models.SwapRequest).filter(
        models.SwapRequest.id == request_id
    ).first()

def respond_to_swap_request(
    db: Session, 
    request_id: int, 
    accept: bool, 
    user_id: int
) -> models.SwapRequest:
    """Accept or reject a swap request."""
    db_request = get_swap_request(db, request_id)

    if not db_request:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Request not found")
    if db_request.responder_id != user_id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized to respond")
    if db_request.status != models.SwapStatus.PENDING:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Request already actioned")

    my_slot = db_request.my_slot
    their_slot = db_request.their_slot

    if accept:
        # 1. Update request status
        db_request.status = models.SwapStatus.ACCEPTED
        
        # 2. Swap owners
        their_slot.owner_id = db_request.requester_id
        my_slot.owner_id = db_request.responder_id
        
        # 3. Set both slots to BUSY
        their_slot.status = models.EventStatus.BUSY
        my_slot.status = models.EventStatus.BUSY
        
    else:
        # 1. Update request status
        db_request.status = models.SwapStatus.REJECTED
        
        # 2. Revert slots to SWAPPABLE (or BUSY, SWAPPABLE is better)
        their_slot.status = models.EventStatus.SWAPPABLE
        my_slot.status = models.EventStatus.SWAPPABLE

    db.commit()
    db.refresh(db_request)
    return db_request