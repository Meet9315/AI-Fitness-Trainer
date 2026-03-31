/**
 * WorkoutTimer Component
 * ======================
 * Stopwatch showing elapsed workout time since camera activation.
 * Displays in mm:ss format with a pulsing dot indicator.
 */

import React, { useState, useEffect, useRef } from 'react';

export default function WorkoutTimer({ isActive }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive]);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="workout-timer glass-card" id="workout-timer">
      <div className="workout-timer__label">Workout Time</div>
      <div className="workout-timer__display">
        {isActive && <span className="workout-timer__dot" />}
        <span className="workout-timer__time">{formatTime(elapsed)}</span>
      </div>
    </div>
  );
}
