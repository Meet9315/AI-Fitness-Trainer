/**
 * ExerciseInstructions Component
 * ==============================
 * Shows form cues and tips for the currently selected exercise.
 * Collapsible panel with key joint tracking info.
 */

import React, { useState } from 'react';

const INSTRUCTIONS = {
  squat: {
    title: 'Squat Form Guide',
    emoji: '🏋️',
    cues: [
      'Stand with feet shoulder-width apart',
      'Keep your back straight throughout',
      'Push your hips back as you descend',
      'Aim for 90° knee angle at the bottom',
      'Drive through your heels to stand up',
    ],
    tracked: ['Knee angle (hip-knee-ankle)', 'Back angle (shoulder-hip-knee)'],
    tips: 'Position yourself so your full body is visible from head to ankles.',
  },
  pushup: {
    title: 'Pushup Form Guide',
    emoji: '💪',
    cues: [
      'Start in a plank position',
      'Hands slightly wider than shoulder-width',
      'Lower until elbows reach 90° angle',
      'Keep your body in a straight line',
      'Fully extend arms at the top',
    ],
    tracked: ['Elbow angle (shoulder-elbow-wrist)', 'Body alignment (shoulder-hip-ankle)'],
    tips: 'Position camera to the side for best tracking. Ensure full body is visible.',
  },
  bicep_curl: {
    title: 'Bicep Curl Form Guide',
    emoji: '🦾',
    cues: [
      'Stand tall with arms at your sides',
      'Keep elbows pinned to your torso',
      'Curl weight up with controlled motion',
      'Squeeze at the top of the curl',
      'Lower slowly — don\'t swing!',
    ],
    tracked: ['Arm angle (shoulder-elbow-wrist)', 'Shoulder stability'],
    tips: 'Stand facing the camera. Keep your upper arms stationary.',
  },
};

export default function ExerciseInstructions({ exercise }) {
  const [isOpen, setIsOpen] = useState(false);
  const info = INSTRUCTIONS[exercise];

  if (!info) return null;

  return (
    <div className="exercise-instructions glass-card" id="exercise-instructions">
      <button
        className="exercise-instructions__toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{info.emoji} {isOpen ? 'Hide' : 'Show'} Form Guide</span>
        <span className="exercise-instructions__chevron" style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {isOpen && (
        <div className="exercise-instructions__content">
          <div className="exercise-instructions__section">
            <div className="exercise-instructions__section-title">Key Cues</div>
            <ol className="exercise-instructions__list">
              {info.cues.map((cue, i) => (
                <li key={i} className="exercise-instructions__item">{cue}</li>
              ))}
            </ol>
          </div>

          <div className="exercise-instructions__section">
            <div className="exercise-instructions__section-title">Tracked Joints</div>
            {info.tracked.map((t, i) => (
              <div key={i} className="exercise-instructions__tracked">📐 {t}</div>
            ))}
          </div>

          <div className="exercise-instructions__tip">
            💡 {info.tips}
          </div>
        </div>
      )}
    </div>
  );
}
