/**
 * Drawing Utilities
 * =================
 * Canvas drawing helpers for rendering pose skeleton overlay.
 * Draws landmarks, connections, and joint angles with neon styling.
 */

// MediaPipe Pose connection pairs for drawing the skeleton
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7],
  [0, 4], [4, 5], [5, 6], [6, 8],
  // Torso
  [11, 12], [11, 23], [12, 24], [23, 24],
  // Left arm
  [11, 13], [13, 15],
  // Right arm
  [12, 14], [14, 16],
  // Left leg
  [23, 25], [25, 27],
  // Right leg
  [24, 26], [26, 28],
  // Left hand
  [15, 17], [15, 19], [15, 21], [17, 19],
  // Right hand
  [16, 18], [16, 20], [16, 22], [18, 20],
  // Left foot
  [27, 29], [27, 31], [29, 31],
  // Right foot
  [28, 30], [28, 32], [30, 32],
];

// Key joints that should be highlighted
const KEY_JOINTS = new Set([11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]);

// Colors for the neon skeleton
const COLORS = {
  connection: 'rgba(0, 245, 255, 0.6)',
  connectionShadow: 'rgba(0, 245, 255, 0.3)',
  landmark: '#00f5ff',
  landmarkGlow: 'rgba(0, 245, 255, 0.5)',
  keyJoint: '#00ff88',
  keyJointGlow: 'rgba(0, 255, 136, 0.5)',
  text: '#ffffff',
  textShadow: 'rgba(0, 0, 0, 0.7)',
};

/**
 * Draw the complete pose skeleton on a canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Array} landmarks - Array of landmark objects with x, y
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 */
export function drawPoseSkeleton(ctx, landmarks, width, height) {
  if (!landmarks || landmarks.length === 0) return;

  ctx.clearRect(0, 0, width, height);

  // Draw connections first (behind landmarks)
  drawConnections(ctx, landmarks, width, height);

  // Draw landmarks on top
  drawLandmarks(ctx, landmarks, width, height);
}

/**
 * Draw connection lines between landmarks
 */
function drawConnections(ctx, landmarks, width, height) {
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  for (const [startIdx, endIdx] of POSE_CONNECTIONS) {
    const start = landmarks[startIdx];
    const end = landmarks[endIdx];

    if (!start || !end) continue;
    if ((start.visibility || 0) < 0.5 || (end.visibility || 0) < 0.5) continue;

    const x1 = start.x * width;
    const y1 = start.y * height;
    const x2 = end.x * width;
    const y2 = end.y * height;

    // Glow effect
    ctx.strokeStyle = COLORS.connectionShadow;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Main line
    ctx.strokeStyle = COLORS.connection;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
}

/**
 * Draw landmark points
 */
function drawLandmarks(ctx, landmarks, width, height) {
  for (let i = 0; i < landmarks.length; i++) {
    const lm = landmarks[i];
    if (!lm || (lm.visibility || 0) < 0.5) continue;

    // Skip face landmarks except nose
    if (i > 0 && i < 11) continue;

    const x = lm.x * width;
    const y = lm.y * height;
    const isKey = KEY_JOINTS.has(i);
    const radius = isKey ? 6 : 4;

    // Glow
    ctx.beginPath();
    ctx.arc(x, y, radius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = isKey ? COLORS.keyJointGlow : COLORS.landmarkGlow;
    ctx.fill();

    // Point
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = isKey ? COLORS.keyJoint : COLORS.landmark;
    ctx.fill();

    // Inner highlight
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.4, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}

/**
 * Draw angle values near the relevant joints
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} angles - Array of {name, value} from backend
 * @param {Array} landmarks 
 * @param {number} width
 * @param {number} height
 * @param {string} exercise - Current exercise name for joint positioning
 */
export function drawAngles(ctx, angles, landmarks, width, height, exercise) {
  if (!angles || angles.length === 0 || !landmarks) return;

  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.textAlign = 'center';

  // Map angle names to approximate landmark positions
  const anglePositions = getAnglePositions(exercise);

  for (const angle of angles) {
    const pos = anglePositions[angle.name];
    if (!pos) continue;

    const lm = landmarks[pos];
    if (!lm || (lm.visibility || 0) < 0.5) continue;

    const x = lm.x * width;
    const y = lm.y * height - 20; // Offset above the joint

    // Background
    const text = `${Math.round(angle.value)}°`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width + 12;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(x - textWidth / 2, y - 10, textWidth, 22, 4);
    ctx.fill();

    // Determine color based on good/bad range
    const isGood = angle.value >= angle.min_good && angle.value <= angle.max_good;
    ctx.fillStyle = isGood ? '#00ff88' : '#ffaa00';
    ctx.fillText(text, x, y + 5);
  }
}

/**
 * Get landmark index positions for angle display based on exercise type
 */
function getAnglePositions(exercise) {
  switch (exercise) {
    case 'squat':
      return {
        'Knee Angle': 25,    // left_knee
        'Back Angle': 23,    // left_hip
      };
    case 'pushup':
      return {
        'Elbow Angle': 13,       // left_elbow
        'Body Alignment': 23,    // left_hip
      };
    case 'bicep_curl':
      return {
        'Arm Angle': 13,     // left_elbow
        'Left Arm': 13,      // left_elbow
        'Right Arm': 14,     // right_elbow
      };
    default:
      return {};
  }
}
