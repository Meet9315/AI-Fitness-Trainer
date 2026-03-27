/**
 * Header Component
 * ================
 * App header with brand, connection status indicators.
 */

import React from 'react';

export default function Header({ isConnected, isModelLoaded, isModelLoading }) {
  return (
    <header className="header glass-card" id="app-header">
      <div className="header__brand">
        <div className="header__icon">🏃</div>
        <div>
          <h1 className="header__title">AI Fitness Trainer</h1>
          <p className="header__subtitle">Real-time Form Correction & Rep Counter</p>
        </div>
      </div>

      <div className="header__status">
        {/* Model Status */}
        <div className="header__status" title="Pose Detection Model">
          <span className={`status-dot ${
            isModelLoaded ? 'status-dot--connected' :
            isModelLoading ? 'status-dot--loading' :
            'status-dot--disconnected'
          }`} />
          <span className="status-text">
            {isModelLoaded ? 'Model Ready' : isModelLoading ? 'Loading Model...' : 'Model Not Loaded'}
          </span>
        </div>

        {/* Divider */}
        <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>•</span>

        {/* WebSocket Status */}
        <div className="header__status" title="Backend Connection">
          <span className={`status-dot ${isConnected ? 'status-dot--connected' : 'status-dot--disconnected'}`} />
          <span className="status-text">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </header>
  );
}
