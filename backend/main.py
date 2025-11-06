from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from datetime import timedelta
from typing import List

from . import crud, models, schemas, auth, database

# Create all database tables (if they don't exist)
# In a real production app, you'd use Alembic for migrations.
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="SlotSwapper API",
    description="API for a peer-to-peer time slot exchange platform"
)

# --- CORS Configuration ---
# Allow requests from your frontend
origins = [
    "http://localhost:5173",  # Vite dev server
    # Add your production frontend URL here
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ==================================
# === AUTHENTICATION ENDPOINTS ===
# ==================================

@app.post("/auth/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user and return a JWT token.
    """
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    new_user = crud.create_user(db, user)
    
    # Create token
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": schemas.User.from_orm(new_user)
    }


@app.post("/auth/login", response_model=schemas.Token)
def login(
    form_data: schemas.LoginRequest, 
    db: Session = Depends(get_db)
):
    """
    Authenticate user and return a JWT token.
    """
    user = crud.get_user_by_email(db, email=form_data.email)
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": schemas.User.from_orm(user)
    }

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """
    Get the currently authenticated user's details.
    """
    return current_user


# ==================================
# === EVENTS (DASHBOARD) ENDPOINTS ===
# ==================================

@app.post("/events", response_model=schemas.Event)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Create a new event for the logged-in user.
    """
    return crud.create_event(db=db, event=event, user_id=current_user.id)


@app.get("/events", response_model=List[schemas.Event])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all events for the logged-in user.
    """
    return crud.get_events_by_user(db=db, user_id=current_user.id)


@app.put("/events/{event_id}", response_model=schemas.Event)
def update_event(
    event_id: int,
    event_data: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Update an event's title, times, or status.
    """
    db_event = crud.update_event(
        db=db, 
        event_id=event_id, 
        event_data=event_data, 
        user_id=current_user.id
    )
    if db_event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return db_event


@app.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Delete an event owned by the logged-in user.
    """
    db_event = crud.delete_event(db=db, event_id=event_id, user_id=current_user.id)
    if db_event is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found")
    return {"ok": True}


# ==================================
# === MARKETPLACE ENDPOINTS ===
# ==================================

@app.get("/marketplace", response_model=List[schemas.MarketplaceSlot])
def get_marketplace_slots(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all swappable slots from *other* users.
    """
    return crud.get_marketplace_slots(db=db, user_id=current_user.id)


# ==================================
# === SWAP REQUEST ENDPOINTS ===
# ==================================

@app.post("/swap-requests", response_model=schemas.SwapRequestDetails)
def create_swap_request(
    request_data: schemas.SwapRequestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Create a new swap request.
    """
    db_request = crud.create_swap_request(
        db=db, 
        request_data=request_data, 
        requester_id=current_user.id
    )
    
    # We need to return the *detailed* schema, so we fetch it again
    # This is less efficient but easier than constructing the detailed view
    query = db.query(models.SwapRequest).filter(
        models.SwapRequest.id == db_request.id
    ).options(
        joinedload(models.SwapRequest.requester),
        joinedload(models.SwapRequest.responder),
        joinedload(models.SwapRequest.my_slot),
        joinedload(models.SwapRequest.their_slot)
    )
    return crud._get_swap_request_details(db, query)[0]


@app.get("/swap-requests/incoming", response_model=List[schemas.SwapRequestDetails])
def get_incoming_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all requests sent *to* the logged-in user.
    """
    return crud.get_incoming_requests(db=db, user_id=current_user.id)


@app.get("/swap-requests/outgoing", response_model=List[schemas.SwapRequestDetails])
def get_outgoing_requests(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Get all requests sent *by* the logged-in user.
    """
    return crud.get_outgoing_requests(db=db, user_id=current_user.id)


@app.post("/swap-requests/{request_id}/respond")
def respond_to_swap_request(
    request_id: int,
    response_data: schemas.SwapRespond,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Accept or reject an incoming swap request.
    """
    db_request = crud.respond_to_swap_request(
        db=db,
        request_id=request_id,
        accept=response_data.accept,
        user_id=current_user.id
    )
    return {
        "status": "success", 
        "request_status": db_request.status
    }


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Welcome to the SlotSwapper API!"}