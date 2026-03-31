/**
 * App.jsx — Main Application Component
 * =====================================
 * Orchestrates all components: camera, exercise selector,
 * rep counter, feedback panel, angle display, performance summary,
 * workout timer, goal setter, exercise instructions, and toasts.
 * 
 * Layout: Camera feed (main area) + Sidebar (controls & stats)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './hooks/useWebSocket';
import { useMediaPipe } from './hooks/useMediaPipe';
import { useSoundEffects } from './hooks/useSoundEffects';
import Header from './components/Header';
import CameraFeed from './components/CameraFeed';
import ExerciseSelector from './components/ExerciseSelector';
import ExerciseInstructions from './components/ExerciseInstructions';
import RepCounter from './components/RepCounter';
import GoalSetter from './components/GoalSetter';
import FeedbackPanel from './components/FeedbackPanel';
import AngleDisplay from './components/AngleDisplay';
import WorkoutTimer from './components/WorkoutTimer';
import PerformanceSummary from './components/PerformanceSummary';
import ToastNotification from './components/ToastNotification';

export default function App() {
  const [currentExercise, setCurrentExercise] = useState('squat');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  // Hooks
  const ws = useWebSocket();
  const mediaPipe = useMediaPipe();
  const sound = useSoundEffects();

  // Extract feedback data
  const repCount = ws.feedback?.rep_count || 0;
  const phase = ws.feedback?.phase || 'idle';
  const formScore = ws.feedback?.form_score || 100;
  const feedbackMessages = ws.feedback?.feedback || [];
  const angles = ws.feedback?.angles || [];

  // Play sound on rep change
  useEffect(() => {
    sound.onRepChange(repCount);
  }, [repCount, sound.onRepChange]);

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
    setResetCounter(c => c + 1);
  }, [ws.resetExercise]);

  // Handle pause/resume
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Handle summary request
  const handleGetSummary = useCallback(() => {
    ws.getSummary();
  }, [ws.getSummary]);

  // Handle goal reached
  const handleGoalReached = useCallback(() => {
    sound.playGoalComplete();
  }, [sound.playGoalComplete]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handleTogglePause();
          break;
        case 'r':
        case 'R':
          handleReset();
          break;
        case '1':
          handleExerciseChange('squat');
          break;
        case '2':
          handleExerciseChange('pushup');
          break;
        case '3':
          handleExerciseChange('bicep_curl');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleReset, handleExerciseChange]);

  return (
    <div className="app" id="app">
      <ToastNotification isConnected={ws.isConnected} />

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
            sendLandmarks={isPaused ? () => {} : ws.sendLandmarks}
            exercise={currentExercise}
            angles={angles}
            isActive={isCameraActive}
            onStart={handleCameraStart}
          />

          {/* Pause/Resume button below camera */}
          {isCameraActive && (
            <div className="app__camera-controls">
              <button
                className={`pause-btn ${isPaused ? 'pause-btn--paused' : ''}`}
                onClick={handleTogglePause}
                id="pause-btn"
                title="Spacebar to toggle"
              >
                {isPaused ? '▶ Resume Workout' : '⏸ Pause Workout'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Sidebar Controls */}
        <aside className="app__sidebar">
          <ExerciseSelector
            currentExercise={currentExercise}
            onSelect={handleExerciseChange}
          />

          <ExerciseInstructions exercise={currentExercise} />

          <WorkoutTimer isActive={isCameraActive && !isPaused} />

          <RepCounter
            repCount={repCount}
            phase={phase}
            formScore={formScore}
          />

          <GoalSetter
            repCount={repCount}
            onGoalReached={handleGoalReached}
          />

          <FeedbackPanel
            feedback={feedbackMessages}
            resetKey={`${currentExercise}-${resetCounter}`}
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

      {/* Keyboard shortcuts hint */}
      <footer className="app__footer">
        <span className="app__shortcut">⌨ Space: Pause</span>
        <span className="app__shortcut">R: Reset</span>
        <span className="app__shortcut">1/2/3: Switch Exercise</span>
      </footer>
    </div>
  );
}
