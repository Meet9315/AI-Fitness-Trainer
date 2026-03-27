/**
 * useMediaPipe Hook
 * =================
 * Initializes MediaPipe PoseLandmarker for real-time pose detection.
 * Runs detection on each video frame and returns landmark data.
 * 
 * Uses the LIVE_STREAM running mode for optimal performance.
 * Model files are loaded from the CDN.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// CDN URLs for MediaPipe model files
const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

export function useMediaPipe() {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const poseLandmarkerRef = useRef(null);
  const lastTimestampRef = useRef(-1);

  // Initialize the PoseLandmarker
  const initialize = useCallback(async () => {
    if (poseLandmarkerRef.current || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[MediaPipe] Loading vision WASM...');
      const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);

      console.log('[MediaPipe] Creating PoseLandmarker...');
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseLandmarkerRef.current = landmarker;
      setIsModelLoaded(true);
      console.log('[MediaPipe] Model loaded successfully!');
    } catch (err) {
      console.error('[MediaPipe] Failed to load:', err);
      setError(err.message || 'Failed to load pose detection model');
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Detect pose in a video frame
  const detectPose = useCallback((videoElement) => {
    if (!poseLandmarkerRef.current || !videoElement) return null;
    if (videoElement.readyState < 2) return null; // Video not ready

    // Ensure monotonically increasing timestamps
    const timestamp = performance.now();
    if (timestamp <= lastTimestampRef.current) return null;
    lastTimestampRef.current = timestamp;

    try {
      const result = poseLandmarkerRef.current.detectForVideo(videoElement, timestamp);

      if (result && result.landmarks && result.landmarks.length > 0) {
        // Convert landmarks to a simple serializable format
        const landmarks = result.landmarks[0].map((lm, idx) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility || 0,
          index: idx,
        }));

        return {
          landmarks,
          worldLandmarks: result.worldLandmarks?.[0] || null,
        };
      }
    } catch (err) {
      // Silently handle detection errors (can happen on frame skip)
      if (!err.message?.includes('timestamp')) {
        console.warn('[MediaPipe] Detection error:', err.message);
      }
    }

    return null;
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
        poseLandmarkerRef.current = null;
      }
    };
  }, []);

  return {
    initialize,
    detectPose,
    isModelLoaded,
    isLoading,
    error,
  };
}
