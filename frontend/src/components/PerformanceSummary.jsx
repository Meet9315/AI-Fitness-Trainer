/**
 * PerformanceSummary Component
 * ============================
 * Modal/panel showing session statistics and history.
 */

import React, { useState } from 'react';

export default function PerformanceSummary({ summary, onRequestSummary, onReset }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    if (!isOpen) {
      onRequestSummary();
    }
    setIsOpen(!isOpen);
  };

  const current = summary?.current;
  const history = summary?.history || [];

  return (
    <div className="performance-summary glass-card" id="performance-summary">
      <button
        className="performance-summary__toggle"
        onClick={handleToggle}
        id="summary-toggle-btn"
      >
        📊 {isOpen ? 'Hide' : 'Show'} Performance Summary
      </button>

      {isOpen && (
        <div className="performance-summary__content">
          {current ? (
            <>
              <div className="performance-summary__stats">
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Exercise</span>
                  <span className="performance-summary__stat-value">
                    {current.exercise}
                  </span>
                </div>
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Total Reps</span>
                  <span className="performance-summary__stat-value">
                    {current.total_reps}
                  </span>
                </div>
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Good Form</span>
                  <span className="performance-summary__stat-value performance-summary__stat-value--good">
                    {current.good_form_count}
                  </span>
                </div>
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Needs Work</span>
                  <span className="performance-summary__stat-value performance-summary__stat-value--warning">
                    {current.bad_form_count}
                  </span>
                </div>
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Form Accuracy</span>
                  <span className={`performance-summary__stat-value ${
                    current.accuracy >= 70 ? 'performance-summary__stat-value--good' : 'performance-summary__stat-value--warning'
                  }`}>
                    {current.accuracy}%
                  </span>
                </div>
                <div className="performance-summary__stat">
                  <span className="performance-summary__stat-label">Avg Range of Motion</span>
                  <span className="performance-summary__stat-value">
                    {current.avg_rom}°
                  </span>
                </div>
              </div>

              {history.length > 0 && (
                <div className="performance-summary__history">
                  <div className="performance-summary__history-title">Previous Exercises</div>
                  {history.map((item, idx) => (
                    <div key={idx} className="performance-summary__history-item">
                      <span>{item.exercise}</span>
                      <span>{item.total_reps} reps • {item.accuracy}% form</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)', padding: 'var(--space-md) 0', textAlign: 'center' }}>
              Start exercising to see your performance summary
            </div>
          )}

          <button
            className="reset-btn"
            onClick={onReset}
            style={{ marginTop: 'var(--space-md)' }}
            id="reset-btn"
          >
            🔄 Reset Counter
          </button>

          <div className="performance-summary__export">
            <button
              className="export-btn"
              onClick={() => {
                const data = JSON.stringify({ current, history, exportedAt: new Date().toISOString() }, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `workout-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              id="export-json-btn"
            >
              📥 Export JSON
            </button>
            <button
              className="export-btn"
              onClick={() => {
                const text = [
                  `🏋️ Workout Summary — ${new Date().toLocaleDateString()}`,
                  `Exercise: ${current?.exercise || 'N/A'}`,
                  `Reps: ${current?.total_reps || 0}`,
                  `Form Accuracy: ${current?.accuracy || 0}%`,
                  `Avg ROM: ${current?.avg_rom || 0}°`,
                  `Good Form: ${current?.good_form_count || 0} | Needs Work: ${current?.bad_form_count || 0}`,
                ].join('\n');
                navigator.clipboard.writeText(text);
              }}
              id="copy-summary-btn"
            >
              📋 Copy to Clipboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
