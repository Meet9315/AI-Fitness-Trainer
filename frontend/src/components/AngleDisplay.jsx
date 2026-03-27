/**
 * AngleDisplay Component
 * ======================
 * Shows relevant joint angles for the current exercise
 * with color-coded values and gauge bars.
 */

import React from 'react';

export default function AngleDisplay({ angles }) {
  if (!angles || angles.length === 0) {
    return (
      <div className="angle-display glass-card" id="angle-display">
        <div className="angle-display__label">Joint Angles</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-sm) 0' }}>
          No angle data available
        </div>
      </div>
    );
  }

  const getAngleStatus = (angle) => {
    if (angle.value >= angle.min_good && angle.value <= angle.max_good) return 'good';
    const margin = (angle.max_good - angle.min_good) * 0.3;
    if (angle.value >= angle.min_good - margin && angle.value <= angle.max_good + margin) return 'warning';
    return 'bad';
  };

  const getGaugeWidth = (angle) => {
    // Normalize to 0-180 range
    return Math.min(100, Math.max(0, (angle.value / 180) * 100));
  };

  const getGaugeColor = (status) => {
    switch (status) {
      case 'good': return 'var(--accent-green)';
      case 'warning': return 'var(--accent-amber)';
      case 'bad': return 'var(--accent-pink)';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="angle-display glass-card" id="angle-display">
      <div className="angle-display__label">Joint Angles</div>
      <div className="angle-display__grid">
        {angles.map((angle, idx) => {
          const status = getAngleStatus(angle);
          return (
            <div key={idx} className="angle-display__item">
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="angle-display__name">{angle.name}</span>
                  <span className={`angle-display__value angle-display__value--${status}`}>
                    {Math.round(angle.value)}°
                  </span>
                </div>
                <div className="angle-display__gauge">
                  <div
                    className="angle-display__gauge-fill"
                    style={{
                      width: `${getGaugeWidth(angle)}%`,
                      background: getGaugeColor(status),
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
