/**
 * App.jsx — Main Application Component
 * =====================================
 * Orchestrates all components: camera, exercise selector,
 * rep counter, feedback panel, angle display, and performance summary.
 * 
 * Layout: Camera feed (main area) + Sidebar (controls & stats)
 */

import React, { useState, useCallback } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useMediaPipe } from './hooks/useMediaPipe';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import ExerciseSelector from './components/ExerciseSelector';
import RepCounter from './components/RepCounter';
import FeedbackPanel from './components/FeedbackPanel';
import AngleDisplay from './components/AngleDisplay';
import PerformanceSummary from './components/PerformanceSummary';

export default function App() {
  const [currentExercise, setCurrentExercise] = useState('squat');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Hooks
  const ws = useWebSocket();
  const mediaPipe = useMediaPipe();

  // Extract feedback data
  const repCount = ws.feedback?.rep_count || 0;
  const phase = ws.feedback?.phase || 'idle';
  const formScore = ws.feedback?.form_score || 100;
  const feedbackMessages = ws.feedback?.feedback || [];
  const angles = ws.feedback?.angles || [];

  // Handle exercise change
  const handleExerciseChange = useCallback((exerciseId) => {
    setCurrentExercise(exerciseId);
    ws.setExercise(exerciseId);
  }, [ws.setExercise]);

  // Handle camera start
  const handleCameraStart = useCallback(() => {
    setIsCameraActive(true);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    ws.resetExercise();
  }, [ws.resetExercise]);

  // Handle summary request
  const handleGetSummary = useCallback(() => {
    ws.getSummary();
  }, [ws.getSummary]);

  return (
    <div className="app" id="app">
      <Header
        isConnected={ws.isConnected}
        isModelLoaded={mediaPipe.isModelLoaded}
        isModelLoading={mediaPipe.isLoading}
      />

      <main className="app__main">
        {/* Left: Camera Feed */}
        <div className="app__camera-section">
          <CameraFeed
            mediaPipe={mediaPipe}
            sendLandmarks={ws.sendLandmarks}
            exercise={currentExercise}
            angles={angles}
            isActive={isCameraActive}
            onStart={handleCameraStart}
          />
        </div>

        {/* Right: Sidebar Controls */}
        <aside className="app__sidebar">
          <ExerciseSelector
            currentExercise={currentExercise}
            onSelect={handleExerciseChange}
          />

          <RepCounter
            repCount={repCount}
            phase={phase}
            formScore={formScore}
          />

          <FeedbackPanel
            feedback={feedbackMessages}
          />

          <AngleDisplay
            angles={angles}
          />

          <PerformanceSummary
            summary={ws.summary}
            onRequestSummary={handleGetSummary}
            onReset={handleReset}
          />
        </aside>
      </main>
    </div>
  );
}
