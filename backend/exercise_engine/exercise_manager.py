"""
Exercise Manager
================
Central registry and state manager for all exercises.
Handles exercise switching, state management, and session tracking.
"""

from exercise_engine.squat import SquatExercise
from exercise_engine.pushup import PushupExercise
from exercise_engine.bicep_curl import BicepCurlExercise
from exercise_engine.base_exercise import BaseExercise


# Exercise registry — add new exercises here
EXERCISE_REGISTRY: dict[str, type[BaseExercise]] = {
    "squat": SquatExercise,
    "pushup": PushupExercise,
    "bicep_curl": BicepCurlExercise,
}


class ExerciseManager:
    """
    Manages the active exercise and maintains session state.

    Usage:
        manager = ExerciseManager()
        manager.set_exercise("squat")
        result = manager.process(landmarks)
    """

    def __init__(self):
        self.current_exercise: BaseExercise = SquatExercise()
        self.current_exercise_name: str = "squat"
        self.session_history: list[dict] = []

    def set_exercise(self, exercise_name: str) -> bool:
        """
        Switch to a new exercise, saving current summary.

        Args:
            exercise_name: Key from EXERCISE_REGISTRY

        Returns:
            True if switch was successful, False if exercise not found
        """
        if exercise_name not in EXERCISE_REGISTRY:
            return False

        # Save summary of current exercise if any reps were done
        if self.current_exercise.rep_count > 0:
            self.session_history.append(self.current_exercise.get_summary())

        # Create new exercise instance
        self.current_exercise = EXERCISE_REGISTRY[exercise_name]()
        self.current_exercise_name = exercise_name
        return True

    def process(self, landmarks: list[dict]) -> dict:
        """
        Process a frame of landmarks with the active exercise.

        Args:
            landmarks: List of 33 landmark dicts

        Returns:
            Dict with rep_count, phase, feedback, angles, form_score
        """
        result = self.current_exercise.process_frame(landmarks)
        result["exercise"] = self.current_exercise_name
        return result

    def reset(self):
        """Reset current exercise state."""
        self.current_exercise.reset()

    def get_summary(self) -> dict:
        """
        Get complete session summary including all exercises.
        """
        current = self.current_exercise.get_summary()

        return {
            "current": current,
            "history": self.session_history,
            "available_exercises": list(EXERCISE_REGISTRY.keys()),
        }

    @staticmethod
    def get_available_exercises() -> list[dict]:
        """Get list of available exercises with metadata."""
        exercises = []
        for key, cls in EXERCISE_REGISTRY.items():
            instance = cls()
            exercises.append({
                "id": key,
                "name": instance.name,
            })
        return exercises
