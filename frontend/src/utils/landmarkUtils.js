/**
 * Landmark Utilities
 * ==================
 * Helper functions for formatting and processing landmark data
 * before sending to the backend.
 */

/**
 * Format landmarks for backend transmission.
 * Strips unnecessary data to minimize WebSocket payload.
 * 
 * @param {Array} landmarks - Raw MediaPipe landmarks
 * @returns {Array} Formatted landmarks with x, y, z, visibility
 */
export function formatLandmarksForBackend(landmarks) {
  if (!landmarks || landmarks.length === 0) return [];

  return landmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z || 0,
    visibility: lm.visibility || 0,
  }));
}

/**
 * Check if enough body landmarks are visible for exercise detection.
 * 
 * @param {Array} landmarks - MediaPipe landmarks
 * @param {string} exercise - Current exercise type
 * @returns {boolean} True if sufficient landmarks are visible
 */
export function hasMinimumVisibility(landmarks, exercise) {
  if (!landmarks || landmarks.length < 33) return false;

  const requiredLandmarks = getRequiredLandmarks(exercise);
  let visibleCount = 0;

  for (const idx of requiredLandmarks) {
    if (landmarks[idx] && (landmarks[idx].visibility || 0) > 0.5) {
      visibleCount++;
    }
  }

  // Require at least 70% of required landmarks to be visible
  return visibleCount / requiredLandmarks.length >= 0.7;
}

/**
 * Get the required landmark indices for a specific exercise.
 */
function getRequiredLandmarks(exercise) {
  switch (exercise) {
    case 'squat':
      // Hips, knees, ankles, shoulders
      return [11, 12, 23, 24, 25, 26, 27, 28];
    case 'pushup':
      // Shoulders, elbows, wrists, hips, ankles
      return [11, 12, 13, 14, 15, 16, 23, 24, 27, 28];
    case 'bicep_curl':
      // Shoulders, elbows, wrists, hips
      return [11, 12, 13, 14, 15, 16, 23, 24];
    default:
      return [11, 12, 23, 24, 25, 26];
  }
}

/**
 * Exercise metadata for display purposes.
 */
export const EXERCISES = [
  {
    id: 'squat',
    name: 'Squats',
    emoji: '🏋️',
    description: 'Tracks knee and back angles',
  },
  {
    id: 'pushup',
    name: 'Pushups',
    emoji: '💪',
    description: 'Tracks elbow and body alignment',
  },
  {
    id: 'bicep_curl',
    name: 'Bicep Curls',
    emoji: '🦾',
    description: 'Tracks arm curl angle',
  },
];
