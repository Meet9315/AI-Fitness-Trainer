"""
Bicep Curl Exercise Detector
=============================
Detects bicep curl repetitions and analyzes form by tracking:
    - Elbow angle (shoulder-elbow-wrist) — primary angle for rep counting
    - Shoulder stability — checks for swinging/cheating

Thresholds:
    - Up (curled): elbow angle < 50°   (arm fully curled)
    - Down: elbow angle > 160°          (arm extended)

Form Rules:
    - "Curl higher" — if not reaching full contraction
    - "Fully extend your arm" — if not reaching full extension
    - "Don't swing your body" — if excessive shoulder movement
"""

from typing import Optional
from exercise_engine.base_exercise import BaseExercise
from exercise_engine.angle_calculator import calculate_joint_angle, get_landmark_point_2d, LANDMARK_INDICES
from models.schemas import FeedbackMessage, AngleData


class BicepCurlExercise(BaseExercise):
    def __init__(self):
        super().__init__("Bicep Curls")
        self._prev_shoulder_y = None

    def _calculate_angles(self, landmarks: list[dict]) -> Optional[dict]:
        """Calculate elbow angle for bicep curl tracking."""
        angles = {}

        # Left arm angle (shoulder-elbow-wrist)
        left_elbow = calculate_joint_angle(
            landmarks, "left_shoulder", "left_elbow", "left_wrist"
        )
        # Right arm angle
        right_elbow = calculate_joint_angle(
            landmarks, "right_shoulder", "right_elbow", "right_wrist"
        )

        if left_elbow is None and right_elbow is None:
            return None

        # Use the arm that's more active (lower angle = more curled)
        if left_elbow is not None and right_elbow is not None:
            # Track both independently — user might curl one arm at a time
            angles["left_elbow"] = left_elbow
            angles["right_elbow"] = right_elbow
            # Use the more active arm (lower angle) as primary
            angles["elbow"] = min(left_elbow, right_elbow)
        else:
            angles["elbow"] = left_elbow if left_elbow is not None else right_elbow
            angles["left_elbow"] = left_elbow
            angles["right_elbow"] = right_elbow

        # Track shoulder position for swing detection
        left_shoulder = get_landmark_point_2d(landmarks, LANDMARK_INDICES["left_shoulder"])
        right_shoulder = get_landmark_point_2d(landmarks, LANDMARK_INDICES["right_shoulder"])

        if left_shoulder and right_shoulder:
            avg_shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
            angles["shoulder_y"] = avg_shoulder_y

        # Wrist-to-shoulder angle for additional tracking
        left_wrist_shoulder = calculate_joint_angle(
            landmarks, "left_hip", "left_shoulder", "left_elbow"
        )
        right_wrist_shoulder = calculate_joint_angle(
            landmarks, "right_hip", "right_shoulder", "right_elbow"
        )

        if left_wrist_shoulder is not None:
            angles["left_shoulder_angle"] = left_wrist_shoulder
        if right_wrist_shoulder is not None:
            angles["right_shoulder_angle"] = right_wrist_shoulder

        return angles

    def _get_primary_angle(self, angles: dict) -> Optional[float]:
        return angles.get("elbow")

    def _get_down_threshold(self) -> float:
        return 50.0  # Arm curled up

    def _get_up_threshold(self) -> float:
        return 160.0  # Arm extended down

    def _update_state(self, primary_angle: float):
        """
        Override state machine: for bicep curls, "down" means arm extended
        and "up" means arm curled. Rep counted on curl-extend cycle.
        """
        curl_threshold = self._get_down_threshold()   # < 50° = curled
        extend_threshold = self._get_up_threshold()    # > 160° = extended

        self._current_min_angle = min(self._current_min_angle, primary_angle)
        self._current_max_angle = max(self._current_max_angle, primary_angle)

        if self.phase == "idle":
            if primary_angle > extend_threshold:
                self.phase = "down"  # Starting position (extended)
            elif primary_angle < curl_threshold:
                self.phase = "up"

        elif self.phase == "down":  # Arm extended, waiting for curl
            if primary_angle < curl_threshold:
                self.phase = "up"  # Curled!
                self._current_min_angle = primary_angle

        elif self.phase == "up":  # Arm curled, waiting for extend
            if primary_angle > extend_threshold:
                self.phase = "down"  # Extended — rep complete!
                self.rep_count += 1
                rom = self._current_max_angle - self._current_min_angle
                self.rom_values.append(rom)
                self._current_max_angle = primary_angle
                self._current_min_angle = primary_angle

    def _check_form(self, landmarks: list[dict], angles: dict) -> list[FeedbackMessage]:
        """Analyze bicep curl form and provide feedback."""
        feedback = []
        elbow_angle = angles.get("elbow")
        is_good_form = True

        if elbow_angle is not None:
            # Check full curl (contraction)
            if self.phase == "up" and elbow_angle > 60:
                self._add_feedback(feedback, "curl", "Curl higher! Squeeze at the top", "warning")
                is_good_form = False
            elif self.phase == "up" and elbow_angle <= 50:
                self._add_feedback(feedback, "good_curl", "Great contraction! 💪", "success")

            # Check full extension
            if self.phase == "down" and elbow_angle < 150:
                self._add_feedback(feedback, "extend", "Fully extend your arm", "warning")
                is_good_form = False

        # Check for body swinging (shoulder shouldn't move much vertically)
        shoulder_y = angles.get("shoulder_y")
        if shoulder_y is not None and self._prev_shoulder_y is not None:
            shoulder_movement = abs(shoulder_y - self._prev_shoulder_y)
            if shoulder_movement > 0.03:  # Significant vertical shoulder movement
                self._add_feedback(feedback, "swing", "Don't swing your body! Isolate the bicep", "error")
                is_good_form = False

        if shoulder_y is not None:
            self._prev_shoulder_y = shoulder_y

        # Check shoulder angle — upper arm should stay relatively still
        for side in ["left", "right"]:
            shoulder_angle = angles.get(f"{side}_shoulder_angle")
            if shoulder_angle is not None and shoulder_angle > 50:
                self._add_feedback(feedback, f"{side}_shoulder_lift",
                                   "Keep your upper arm still, only bend at the elbow", "warning")
                is_good_form = False

        # Track form quality
        if self.phase in ("up", "down") and self._frame_count % 5 == 0:
            if is_good_form:
                self.good_form_count += 1
            else:
                self.bad_form_count += 1

        return feedback

    def _format_angles(self, angles: dict) -> list[AngleData]:
        """Format bicep curl angles for UI display."""
        result = []
        if angles.get("elbow") is not None:
            result.append(AngleData(
                name="Arm Angle",
                value=round(angles["elbow"], 1),
                min_good=30.0,
                max_good=50.0,
            ))
        for side in ["left", "right"]:
            key = f"{side}_elbow"
            if angles.get(key) is not None:
                result.append(AngleData(
                    name=f"{side.title()} Arm",
                    value=round(angles[key], 1),
                    min_good=30.0,
                    max_good=50.0,
                ))
        return result
