import enum
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Enum, func
)
from sqlalchemy.orm import relationship
from .database import Base

class EventStatus(str, enum.Enum):
    BUSY = "BUSY"
    SWAPPABLE = "SWAPPABLE"
    SWAP_PENDING = "SWAP_PENDING"

class SwapStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # Relationships
    events = relationship("Event", back_populates="owner")
    sent_requests = relationship(
        "SwapRequest",
        foreign_keys="[SwapRequest.requester_id]",
        back_populates="requester"
    )
    received_requests = relationship(
        "SwapRequest",
        foreign_keys="[SwapRequest.responder_id]",
        back_populates="responder"
    )


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.BUSY, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="events")


class SwapRequest(Base):
    __tablename__ = "swap_requests"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(SwapStatus), default=SwapStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # User relationships
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    responder_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Event relationships
    my_slot_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    their_slot_id = Column(Integer, ForeignKey("events.id"), nullable=False)

    # Relationships
    requester = relationship(
        "User", foreign_keys=[requester_id], back_populates="sent_requests"
    )
    responder = relationship(
        "User", foreign_keys=[responder_id], back_populates="received_requests"
    )
    my_slot = relationship("Event", foreign_keys=[my_slot_id])
    their_slot = relationship("Event", foreign_keys=[their_slot_id])