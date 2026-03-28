/**
 * CameraFeed Component
 * ====================
 * Webcam video capture with MediaPipe pose detection overlay.
 * Renders the live camera feed and draws skeleton on a canvas.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { drawPoseSkeleton, drawAngles } from '../utils/drawingUtils';
import { formatLandmarksForBackend, hasMinimumVisibility } from '../utils/landmarkUtils';

const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: 'user',
  frameRate: { ideal: 30 },
};

// Throttle sending landmarks to backend (every ~66ms = ~15fps for WS)
const SEND_INTERVAL_MS = 66;

export default function CameraFeed({
  mediaPipe,
  sendLandmarks,
  exercise,
  angles,
  isActive,
  onStart,
}) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastSendTimeRef = useRef(0);
  const [isCameraReady, setIsCameraReady] = useState(false);

  const { initialize, detectPose, isModelLoaded, isLoading } = mediaPipe;

  // Handle camera start
  const handleStartCamera = useCallback(async () => {
    await initialize();
    if (onStart) onStart();
  }, [initialize, onStart]);

  // Handle webcam ready
  const handleUserMedia = useCallback(() => {
    setIsCameraReady(true);
  }, []);

  // Main detection loop
  useEffect(() => {
    if (!isModelLoaded || !isCameraReady || !isActive) return;

    let running = true;

    const detect = () => {
      if (!running) return;

      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState >= 2) {
        const ctx = canvas.getContext('2d');

        // Match canvas to video dimensions
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        // Run pose detection
        const result = detectPose(video);

        // Verify it's actually a human by checking visibility confidence
        const isHumanDetected = result && result.landmarks && hasMinimumVisibility(result.landmarks, exercise);

        if (isHumanDetected) {
          // Draw skeleton overlay
          drawPoseSkeleton(ctx, result.landmarks, canvas.width, canvas.height);

          // Draw angle values if available
          if (angles && angles.length > 0) {
            drawAngles(ctx, angles, result.landmarks, canvas.width, canvas.height, exercise);
          }

          // Throttle landmark sending to backend
          const now = Date.now();
          if (now - lastSendTimeRef.current >= SEND_INTERVAL_MS) {
            const formatted = formatLandmarksForBackend(result.landmarks);
            sendLandmarks(formatted);
            lastSendTimeRef.current = now;
          }
        } else {
          // Clear canvas if no valid pose detected
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();

    return () => {
      running = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isModelLoaded, isCameraReady, isActive, detectPose, sendLandmarks, angles, exercise]);

  return (
    <div className="camera-feed glass-card" id="camera-feed">
      {isActive && (
        <>
          <Webcam
            ref={webcamRef}
            className="camera-feed__video"
            videoConstraints={VIDEO_CONSTRAINTS}
            onUserMedia={handleUserMedia}
            audio={false}
            mirrored={false}
            style={{ transform: 'scaleX(-1)' }}
          />
          <canvas
            ref={canvasRef}
            className="camera-feed__canvas"
          />
          <div className="camera-feed__overlay" />
        </>
      )}

      {!isActive && (
        <div className="camera-feed__placeholder">
          <div className="camera-feed__placeholder-icon">📷</div>
          <p className="camera-feed__placeholder-text">
            {isLoading
              ? 'Loading AI pose detection model... This may take a moment.'
              : 'Click below to start the camera and load the AI model for real-time exercise tracking.'}
          </p>
          {!isLoading && (
            <button
              className="camera-feed__start-btn"
              onClick={handleStartCamera}
              id="start-camera-btn"
            >
              {isModelLoaded ? '▶ Start Camera' : '🚀 Load Model & Start'}
            </button>
          )}
          {isLoading && (
            <div style={{ color: 'var(--accent-amber)', fontSize: 'var(--font-size-sm)' }}>
              ⏳ Loading model...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
