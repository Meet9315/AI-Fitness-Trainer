"""
Pydantic schemas for WebSocket message serialization.
Defines the data contracts between frontend and backend.
"""

from pydantic import BaseModel
from typing import Optional


class Landmark(BaseModel):
    """A single body landmark with 3D coordinates and visibility."""
    x: float
    y: float
    z: float
    visibility: float = 1.0


class LandmarkFrame(BaseModel):
    """
    A complete frame of landmarks sent from the frontend.
    Contains 33 MediaPipe pose landmarks.
    """
    landmarks: list[Landmark]
    timestamp: float = 0.0


class ExerciseCommand(BaseModel):
    """Command to switch the active exercise."""
    type: str = "set_exercise"  # "set_exercise" | "reset" | "get_summary"
    exercise: Optional[str] = None


class AngleData(BaseModel):
    """Joint angle information for display."""
    name: str
    value: float
    min_good: float
    max_good: float


class FeedbackMessage(BaseModel):
    """A single feedback message with severity level."""
    message: str
    level: str = "info"  # "info" | "success" | "warning" | "error"


class FeedbackResponse(BaseModel):
    """
    Response sent from backend to frontend after processing a frame.
    Contains everything the UI needs to update.
    """
    rep_count: int = 0
    phase: str = "idle"  # "up" | "down" | "idle"
    feedback: list[FeedbackMessage] = []
    angles: list[AngleData] = []
    form_score: float = 100.0
    exercise: str = "squat"


class PerformanceSummary(BaseModel):
    """Session performance summary."""
    exercise: str
    total_reps: int
    good_form_count: int
    bad_form_count: int
    accuracy: float
    avg_rom: float  # Average range of motion
