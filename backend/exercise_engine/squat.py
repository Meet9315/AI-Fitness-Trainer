"""
Squat Exercise Detector
=======================
Detects squat repetitions and analyzes form by tracking:
    - Knee angle (hip-knee-ankle) — primary angle for rep counting
    - Back angle (shoulder-hip-knee) — for posture checks
    - Symmetry between left and right sides

Thresholds:
    - Down: knee angle < 100°  (full squat depth)
    - Up: knee angle > 160°    (standing position)

Form Rules:
    - "Go lower" — if angle stays between 100-130° without going deeper
    - "Keep your back straight" — if back angle deviates significantly
    - "Good depth!" — positive feedback on proper depth
"""

from typing import Optional
from exercise_engine.base_exercise import BaseExercise
from exercise_engine.angle_calculator import calculate_joint_angle
from models.schemas import FeedbackMessage, AngleData


class SquatExercise(BaseExercise):
    def __init__(self):
        super().__init__("Squats")

    def _calculate_angles(self, landmarks: list[dict]) -> Optional[dict]:
        """Calculate knee and back angles for both sides."""
        angles = {}

        # Left knee angle (hip-knee-ankle)
        left_knee = calculate_joint_angle(
            landmarks, "left_hip", "left_knee", "left_ankle"
        )
        # Right knee angle
        right_knee = calculate_joint_angle(
            landmarks, "right_hip", "right_knee", "right_ankle"
        )

        if left_knee is None and right_knee is None:
            return None

        # Use average of both sides, or whichever is available
        if left_knee is not None and right_knee is not None:
            angles["knee"] = (left_knee + right_knee) / 2
            angles["left_knee"] = left_knee
            angles["right_knee"] = right_knee
        else:
            angles["knee"] = left_knee if left_knee is not None else right_knee
            angles["left_knee"] = left_knee
            angles["right_knee"] = right_knee

        # Back angle (shoulder-hip-knee) for posture check
        left_back = calculate_joint_angle(
            landmarks, "left_shoulder", "left_hip", "left_knee"
        )
        right_back = calculate_joint_angle(
            landmarks, "right_shoulder", "right_hip", "right_knee"
        )

        if left_back is not None and right_back is not None:
            angles["back"] = (left_back + right_back) / 2
        elif left_back is not None:
            angles["back"] = left_back
        elif right_back is not None:
            angles["back"] = right_back

        return angles

    def _get_primary_angle(self, angles: dict) -> Optional[float]:
        return angles.get("knee")

    def _get_down_threshold(self) -> float:
        return 100.0

    def _get_up_threshold(self) -> float:
        return 160.0

    def _check_form(self, landmarks: list[dict], angles: dict) -> list[FeedbackMessage]:
        """Analyze squat form and provide feedback."""
        feedback = []
        knee_angle = angles.get("knee")
        back_angle = angles.get("back")
        is_good_form = True

        if knee_angle is not None:
            # Check depth
            if self.phase == "down":
                if knee_angle > 130:
                    self._add_feedback(feedback, "depth", "Go lower! Aim for 90° knee angle", "warning")
                    is_good_form = False
                elif knee_angle <= 100:
                    self._add_feedback(feedback, "good_depth", "Great depth! 💪", "success")

            # Check if knees are going too far forward (approximate check)
            if self.phase == "down" and knee_angle < 80:
                self._add_feedback(feedback, "too_deep", "Don't go too deep, protect your knees", "warning")
                is_good_form = False

        if back_angle is not None:
            # Check back straightness — back angle should stay relatively open
            if back_angle < 60:
                self._add_feedback(feedback, "back", "Keep your back straighter!", "error")
                is_good_form = False
            elif back_angle < 80:
                self._add_feedback(feedback, "back_warn", "Watch your back posture", "warning")
                is_good_form = False

        # Check symmetry between left and right knee
        left_knee = angles.get("left_knee")
        right_knee = angles.get("right_knee")
        if left_knee is not None and right_knee is not None:
            diff = abs(left_knee - right_knee)
            if diff > 20:
                self._add_feedback(feedback, "symmetry", "Keep both knees even", "warning")
                is_good_form = False

        # Track form quality
        if self.phase in ("up", "down") and self._frame_count % 5 == 0:
            if is_good_form:
                self.good_form_count += 1
            else:
                self.bad_form_count += 1

        # Phase feedback
        if self.phase == "up" and knee_angle and knee_angle > 160:
            self._add_feedback(feedback, "standing", "Ready for next rep", "info")

        return feedback

    def _format_angles(self, angles: dict) -> list[AngleData]:
        """Format squat angles for UI display."""
        result = []
        if angles.get("knee") is not None:
            result.append(AngleData(
                name="Knee Angle",
                value=round(angles["knee"], 1),
                min_good=85.0,
                max_good=100.0,
            ))
        if angles.get("back") is not None:
            result.append(AngleData(
                name="Back Angle",
                value=round(angles["back"], 1),
                min_good=70.0,
                max_good=180.0,
            ))
        return result
