/**
 * RepCounter Component
 * ====================
 * Large animated counter display with phase indicator and form score.
 */

import React, { useEffect, useState, useRef } from 'react';

export default function RepCounter({ repCount, phase, formScore }) {
  const [isPulsing, setIsPulsing] = useState(false);
  const prevCountRef = useRef(repCount);

  // Pulse animation on rep increase
  useEffect(() => {
    if (repCount > prevCountRef.current) {
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 400);
      prevCountRef.current = repCount;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = repCount;
  }, [repCount]);

  const getPhaseLabel = () => {
    switch (phase) {
      case 'up': return '↑ UP';
      case 'down': return '↓ DOWN';
      default: return '● READY';
    }
  };

  const getScoreColor = () => {
    if (formScore >= 80) return 'var(--accent-green)';
    if (formScore >= 50) return 'var(--accent-amber)';
    return 'var(--accent-pink)';
  };

  return (
    <div className="rep-counter glass-card" id="rep-counter">
      <div className="rep-counter__label">Reps</div>
      <div className={`rep-counter__value ${isPulsing ? 'rep-counter__value--pulse' : ''}`}>
        {repCount}
      </div>
      <div className={`rep-counter__phase rep-counter__phase--${phase || 'idle'}`}>
        {getPhaseLabel()}
      </div>

      <div className="rep-counter__score">
        <span className="rep-counter__score-label">Form</span>
        <div className="rep-counter__score-bar">
          <div
            className="rep-counter__score-fill"
            style={{ width: `${formScore}%` }}
          />
        </div>
        <span
          className="rep-counter__score-value"
          style={{ color: getScoreColor() }}
        >
          {Math.round(formScore)}%
        </span>
      </div>
    </div>
  );
}
