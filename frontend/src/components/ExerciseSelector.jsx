/**
 * ExerciseSelector Component
 * ==========================
 * Pill-style toggle buttons for switching between exercises.
 */

import React from 'react';
import { EXERCISES } from '../utils/landmarkUtils';

export default function ExerciseSelector({ currentExercise, onSelect }) {
  return (
    <div className="exercise-selector glass-card" id="exercise-selector">
      <div className="exercise-selector__label">Exercise</div>
      <div className="exercise-selector__grid">
        {EXERCISES.map((ex) => (
          <button
            key={ex.id}
            id={`exercise-btn-${ex.id}`}
            className={`exercise-selector__btn ${
              currentExercise === ex.id ? 'exercise-selector__btn--active' : ''
            }`}
            onClick={() => onSelect(ex.id)}
            title={ex.description}
          >
            <span className="exercise-selector__emoji">{ex.emoji}</span>
            {ex.name}
          </button>
        ))}
      </div>
    </div>
  );
}
