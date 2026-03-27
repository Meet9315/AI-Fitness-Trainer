"""
Pushup Exercise Detector
========================
Detects pushup repetitions and analyzes form by tracking:
    - Elbow angle (shoulder-elbow-wrist) — primary angle for rep counting
    - Body alignment (shoulder-hip-ankle) — for plank form check

Thresholds:
    - Down: elbow angle < 90°   (chest near ground)
    - Up: elbow angle > 160°    (arms extended)

Form Rules:
    - "Go lower" — if not reaching full depth
    - "Keep your body straight" — if hips sag or pike
    - "Full extension" — if not locking out at top
"""

from typing import Optional
from exercise_engine.base_exercise import BaseExercise
from exercise_engine.angle_calculator import calculate_joint_angle
from models.schemas import FeedbackMessage, AngleData


class PushupExercise(BaseExercise):
    def __init__(self):
        super().__init__("Pushups")

    def _calculate_angles(self, landmarks: list[dict]) -> Optional[dict]:
        """Calculate elbow and body alignment angles."""
        angles = {}

        # Left elbow angle (shoulder-elbow-wrist)
        left_elbow = calculate_joint_angle(
            landmarks, "left_shoulder", "left_elbow", "left_wrist"
        )
        # Right elbow angle
        right_elbow = calculate_joint_angle(
            landmarks, "right_shoulder", "right_elbow", "right_wrist"
        )

        if left_elbow is None and right_elbow is None:
            return None

        if left_elbow is not None and right_elbow is not None:
            angles["elbow"] = (left_elbow + right_elbow) / 2
            angles["left_elbow"] = left_elbow
            angles["right_elbow"] = right_elbow
        else:
            angles["elbow"] = left_elbow if left_elbow is not None else right_elbow
            angles["left_elbow"] = left_elbow
            angles["right_elbow"] = right_elbow

        # Body alignment (shoulder-hip-ankle) for plank form
        left_body = calculate_joint_angle(
            landmarks, "left_shoulder", "left_hip", "left_ankle"
        )
        right_body = calculate_joint_angle(
            landmarks, "right_shoulder", "right_hip", "right_ankle"
        )

        if left_body is not None and right_body is not None:
            angles["body"] = (left_body + right_body) / 2
        elif left_body is not None:
            angles["body"] = left_body
        elif right_body is not None:
            angles["body"] = right_body

        return angles

    def _get_primary_angle(self, angles: dict) -> Optional[float]:
        return angles.get("elbow")

    def _get_down_threshold(self) -> float:
        return 90.0

    def _get_up_threshold(self) -> float:
        return 160.0

    def _check_form(self, landmarks: list[dict], angles: dict) -> list[FeedbackMessage]:
        """Analyze pushup form and provide feedback."""
        feedback = []
        elbow_angle = angles.get("elbow")
        body_angle = angles.get("body")
        is_good_form = True

        if elbow_angle is not None:
            # Check depth
            if self.phase == "down":
                if elbow_angle > 120:
                    self._add_feedback(feedback, "depth", "Go lower! Chest toward the ground", "warning")
                    is_good_form = False
                elif elbow_angle <= 90:
                    self._add_feedback(feedback, "good_depth", "Perfect depth! 💪", "success")

            # Check lockout at top
            if self.phase == "up" and elbow_angle < 155:
                self._add_feedback(feedback, "lockout", "Fully extend your arms at the top", "warning")
                is_good_form = False

        if body_angle is not None:
            # Check body alignment — should be relatively straight (~160-180°)
            if body_angle < 140:
                self._add_feedback(feedback, "hips_high", "Lower your hips, keep body straight", "error")
                is_good_form = False
            elif body_angle < 155:
                self._add_feedback(feedback, "hips_sag", "Keep your body in a straight line", "warning")
                is_good_form = False
            elif body_angle > 175:
                self._add_feedback(feedback, "good_form", "Great plank position! ✨", "success")

        # Symmetry check
        left = angles.get("left_elbow")
        right = angles.get("right_elbow")
        if left is not None and right is not None:
            if abs(left - right) > 25:
                self._add_feedback(feedback, "symmetry", "Keep both arms even", "warning")
                is_good_form = False

        # Track form quality
        if self.phase in ("up", "down") and self._frame_count % 5 == 0:
            if is_good_form:
                self.good_form_count += 1
            else:
                self.bad_form_count += 1

        return feedback

    def _format_angles(self, angles: dict) -> list[AngleData]:
        """Format pushup angles for UI display."""
        result = []
        if angles.get("elbow") is not None:
            result.append(AngleData(
                name="Elbow Angle",
                value=round(angles["elbow"], 1),
                min_good=80.0,
                max_good=95.0,
            ))
        if angles.get("body") is not None:
            result.append(AngleData(
                name="Body Alignment",
                value=round(angles["body"], 1),
                min_good=160.0,
                max_good=180.0,
            ))
        return result
