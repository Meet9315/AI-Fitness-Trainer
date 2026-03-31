/**
 * GoalSetter Component
 * ====================
 * Allows users to set a target rep count.
 * Shows a circular progress ring and celebration on goal completion.
 */

import React, { useState, useEffect, useRef } from 'react';

export default function GoalSetter({ repCount, onGoalReached }) {
  const [goal, setGoal] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const inputRef = useRef(null);

  // Detect goal reached
  useEffect(() => {
    if (goal > 0 && repCount >= goal && !goalReached) {
      setGoalReached(true);
      if (onGoalReached) onGoalReached();
    }
  }, [repCount, goal, goalReached, onGoalReached]);

  // Reset goalReached when goal changes
  useEffect(() => {
    setGoalReached(false);
  }, [goal]);

  const handleSetGoal = (value) => {
    const num = parseInt(value, 10);
    setGoal(isNaN(num) || num < 0 ? 0 : num);
    setIsEditing(false);
  };

  const progress = goal > 0 ? Math.min(100, (repCount / goal) * 100) : 0;
  const circumference = 2 * Math.PI * 36; // r=36
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  if (goal === 0 && !isEditing) {
    return (
      <div className="goal-setter glass-card" id="goal-setter">
        <button
          className="goal-setter__set-btn"
          onClick={() => {
            setIsEditing(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
        >
          🎯 Set Rep Goal
        </button>
      </div>
    );
  }

  return (
    <div className={`goal-setter glass-card ${goalReached ? 'goal-setter--complete' : ''}`} id="goal-setter">
      {isEditing ? (
        <div className="goal-setter__edit">
          <label className="goal-setter__label">Target Reps</label>
          <input
            ref={inputRef}
            type="number"
            className="goal-setter__input"
            min="1"
            max="999"
            placeholder="e.g. 10"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSetGoal(e.target.value);
              if (e.key === 'Escape') { setIsEditing(false); setGoal(0); }
            }}
            onBlur={(e) => handleSetGoal(e.target.value)}
          />
        </div>
      ) : (
        <div className="goal-setter__progress">
          <svg className="goal-setter__ring" viewBox="0 0 80 80">
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={goalReached ? 'var(--accent-green)' : 'var(--accent-cyan)'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 40 40)"
              style={{ transition: 'stroke-dashoffset 0.4s ease' }}
            />
            <text
              x="40" y="36"
              textAnchor="middle"
              fill="var(--text-primary)"
              fontSize="14"
              fontWeight="800"
              fontFamily="Inter, sans-serif"
            >
              {repCount}
            </text>
            <text
              x="40" y="50"
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9"
              fontFamily="Inter, sans-serif"
            >
              / {goal}
            </text>
          </svg>
          {goalReached && (
            <div className="goal-setter__celebration">🎉 Goal reached!</div>
          )}
          <button
            className="goal-setter__change-btn"
            onClick={() => setIsEditing(true)}
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
