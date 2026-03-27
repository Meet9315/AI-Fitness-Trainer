"""
Angle Calculator Utility
========================
Provides mathematical functions to calculate angles between body joints
using 3D landmark coordinates. Uses numpy for efficient vector math.

MediaPipe Pose Landmark indices reference:
    0: nose, 11: left_shoulder, 12: right_shoulder,
    13: left_elbow, 14: right_elbow, 15: left_wrist, 16: right_wrist,
    23: left_hip, 24: right_hip, 25: left_knee, 26: right_knee,
    27: left_ankle, 28: right_ankle
"""

import numpy as np
from typing import Optional


# MediaPipe Pose landmark indices
LANDMARK_INDICES = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28,
}


def calculate_angle(point_a: list, point_b: list, point_c: list) -> float:
    """
    Calculate the angle at point_b formed by the line segments
    point_a -> point_b and point_c -> point_b.

    Args:
        point_a: [x, y, z] coordinates of the first point
        point_b: [x, y, z] coordinates of the vertex point
        point_c: [x, y, z] coordinates of the third point

    Returns:
        Angle in degrees (0-180)
    """
    a = np.array(point_a)
    b = np.array(point_b)
    c = np.array(point_c)

    # Vectors from vertex to each endpoint
    ba = a - b
    bc = c - b

    # Cosine of angle using dot product
    cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-6)

    # Clamp to valid range to avoid NaN from floating point errors
    cosine_angle = np.clip(cosine_angle, -1.0, 1.0)

    angle = np.degrees(np.arccos(cosine_angle))
    return float(angle)


def get_landmark_point(landmarks: list, index: int) -> Optional[list]:
    """
    Extract [x, y, z] coordinates for a landmark by index.

    Args:
        landmarks: List of landmark dicts with x, y, z, visibility
        index: MediaPipe landmark index

    Returns:
        [x, y, z] list or None if landmark not visible enough
    """
    if index >= len(landmarks):
        return None

    lm = landmarks[index]
    # Only use landmarks with reasonable visibility
    if lm.get("visibility", 0) < 0.5:
        return None

    return [lm["x"], lm["y"], lm["z"]]


def get_landmark_point_2d(landmarks: list, index: int) -> Optional[list]:
    """
    Extract [x, y] coordinates for 2D angle calculation.
    Uses only x, y (ignoring depth) for more stable angle readings.
    """
    if index >= len(landmarks):
        return None

    lm = landmarks[index]
    if lm.get("visibility", 0) < 0.5:
        return None

    return [lm["x"], lm["y"], 0.0]


def calculate_joint_angle(landmarks: list, joint_a: str, joint_b: str, joint_c: str) -> Optional[float]:
    """
    Calculate angle at joint_b between joint_a-joint_b-joint_c.

    Args:
        landmarks: List of landmark dicts
        joint_a, joint_b, joint_c: Joint names from LANDMARK_INDICES

    Returns:
        Angle in degrees or None if landmarks not visible
    """
    idx_a = LANDMARK_INDICES.get(joint_a)
    idx_b = LANDMARK_INDICES.get(joint_b)
    idx_c = LANDMARK_INDICES.get(joint_c)

    if any(idx is None for idx in [idx_a, idx_b, idx_c]):
        return None

    # Use 2D points for more stable angle calculation
    point_a = get_landmark_point_2d(landmarks, idx_a)
    point_b = get_landmark_point_2d(landmarks, idx_b)
    point_c = get_landmark_point_2d(landmarks, idx_c)

    if any(p is None for p in [point_a, point_b, point_c]):
        return None

    return calculate_angle(point_a, point_b, point_c)
