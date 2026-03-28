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
  const hasVisibleJoints = visibleCount / requiredLandmarks.length >= 0.7;

  // Calculate bounding box size to prevent micro-hallucinations (like hands being mistaken for full bodies)
  let minX = 1, maxX = 0, minY = 1, maxY = 0;
  for (const lm of landmarks) {
    if (lm.x < minX) minX = lm.x;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.y > maxY) maxY = lm.y;
  }
  
  const boundingBoxArea = (maxX - minX) * (maxY - minY);
  // Human should take up at least a reasonable portion of the screen (e.g. > 5% of the frame)
  const isLargeEnough = boundingBoxArea > 0.05;

  return hasVisibleJoints && isLargeEnough;
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
