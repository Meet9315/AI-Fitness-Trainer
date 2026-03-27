"""
Base Exercise Class
===================
Abstract base class for all exercise detectors.
Implements the state machine pattern for rep counting
and provides common utilities for form analysis.

Each exercise subclass defines:
    - Which joints to track
    - Angle thresholds for up/down phases
    - Form validation rules
"""

from abc import ABC, abstractmethod
from typing import Optional
from models.schemas import FeedbackMessage, AngleData


class BaseExercise(ABC):
    """
    Abstract base class for exercise detection.

    Uses a state machine with two states: 'up' and 'down'.
    A rep is counted on each full cycle (down -> up).

    Attributes:
        name: Exercise display name
        rep_count: Current number of completed reps
        phase: Current phase ('up', 'down', or 'idle')
        good_form_count: Number of reps with good form
        bad_form_count: Number of reps with bad form
        rom_values: Range of motion values for each rep
    """

    def __init__(self, name: str):
        self.name = name
        self.rep_count = 0
        self.phase = "idle"
        self.good_form_count = 0
        self.bad_form_count = 0
        self.rom_values: list[float] = []
        self._current_min_angle = 180.0
        self._current_max_angle = 0.0
        self._feedback_cooldown: dict[str, int] = {}
        self._frame_count = 0

    def process_frame(self, landmarks: list[dict]) -> dict:
        """
        Process a single frame of landmark data.

        Args:
            landmarks: List of 33 landmark dicts with x, y, z, visibility

        Returns:
            Dict with rep_count, phase, feedback, angles, form_score
        """
        self._frame_count += 1

        # Decrease feedback cooldowns
        for key in list(self._feedback_cooldown.keys()):
            self._feedback_cooldown[key] -= 1
            if self._feedback_cooldown[key] <= 0:
                del self._feedback_cooldown[key]

        # Get angles for this exercise
        angles = self._calculate_angles(landmarks)

        if not angles:
            return {
                "rep_count": self.rep_count,
                "phase": self.phase,
                "feedback": [FeedbackMessage(message="Body not fully visible", level="warning")],
                "angles": [],
                "form_score": self._get_form_score(),
            }

        # Update rep counting state machine
        primary_angle = self._get_primary_angle(angles)
        if primary_angle is not None:
            self._update_state(primary_angle)

        # Check form
        feedback = self._check_form(landmarks, angles)

        # Convert angles to AngleData
        angle_data = self._format_angles(angles)

        return {
            "rep_count": self.rep_count,
            "phase": self.phase,
            "feedback": feedback,
            "angles": angle_data,
            "form_score": self._get_form_score(),
        }

    def _update_state(self, primary_angle: float):
        """
        Update the state machine based on the primary angle.
        Counts a rep when transitioning from down -> up.
        """
        down_threshold = self._get_down_threshold()
        up_threshold = self._get_up_threshold()

        # Track range of motion
        self._current_min_angle = min(self._current_min_angle, primary_angle)
        self._current_max_angle = max(self._current_max_angle, primary_angle)

        if self.phase == "idle":
            if primary_angle > up_threshold:
                self.phase = "up"
            elif primary_angle < down_threshold:
                self.phase = "down"

        elif self.phase == "up":
            if primary_angle < down_threshold:
                self.phase = "down"
                self._current_min_angle = primary_angle

        elif self.phase == "down":
            if primary_angle > up_threshold:
                self.phase = "up"
                # Complete rep!
                self.rep_count += 1
                rom = self._current_max_angle - self._current_min_angle
                self.rom_values.append(rom)
                self._current_max_angle = primary_angle
                self._current_min_angle = primary_angle

    def _add_feedback(self, feedback_list: list, key: str, message: str, level: str = "warning"):
        """Add feedback with cooldown to avoid spamming."""
        if key not in self._feedback_cooldown:
            feedback_list.append(FeedbackMessage(message=message, level=level))
            self._feedback_cooldown[key] = 30  # ~1 second cooldown at 30fps

    def _get_form_score(self) -> float:
        """Calculate overall form score as percentage."""
        total = self.good_form_count + self.bad_form_count
        if total == 0:
            return 100.0
        return round((self.good_form_count / total) * 100, 1)

    def reset(self):
        """Reset all counters and state."""
        self.rep_count = 0
        self.phase = "idle"
        self.good_form_count = 0
        self.bad_form_count = 0
        self.rom_values = []
        self._current_min_angle = 180.0
        self._current_max_angle = 0.0
        self._feedback_cooldown = {}
        self._frame_count = 0

    def get_summary(self) -> dict:
        """Get performance summary for this exercise."""
        avg_rom = sum(self.rom_values) / len(self.rom_values) if self.rom_values else 0.0
        return {
            "exercise": self.name,
            "total_reps": self.rep_count,
            "good_form_count": self.good_form_count,
            "bad_form_count": self.bad_form_count,
            "accuracy": self._get_form_score(),
            "avg_rom": round(avg_rom, 1),
        }

    @abstractmethod
    def _calculate_angles(self, landmarks: list[dict]) -> Optional[dict]:
        """Calculate all relevant angles for this exercise."""
        pass

    @abstractmethod
    def _get_primary_angle(self, angles: dict) -> Optional[float]:
        """Get the primary angle used for rep counting."""
        pass

    @abstractmethod
    def _get_down_threshold(self) -> float:
        """Angle threshold for 'down' phase."""
        pass

    @abstractmethod
    def _get_up_threshold(self) -> float:
        """Angle threshold for 'up' phase."""
        pass

    @abstractmethod
    def _check_form(self, landmarks: list[dict], angles: dict) -> list[FeedbackMessage]:
        """Check form and return feedback messages."""
        pass

    @abstractmethod
    def _format_angles(self, angles: dict) -> list[AngleData]:
        """Format angles for display."""
        pass
