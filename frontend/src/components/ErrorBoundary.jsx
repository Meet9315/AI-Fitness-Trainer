/**
 * ErrorBoundary Component
 * =======================
 * Catches React rendering errors and shows a recovery UI
 * instead of a white screen crash.
 */

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#060613',
          color: '#f0f0ff',
          fontFamily: 'Inter, sans-serif',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Something went wrong</h2>
          <p style={{ color: '#a0a0c0', maxWidth: '400px', lineHeight: 1.6 }}>
            The application encountered an unexpected error. This might happen if the
            camera or pose detection model failed to initialize.
          </p>
          <code style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            fontSize: '0.8rem',
            color: '#ff0055',
            maxWidth: '500px',
            overflow: 'auto',
          }}>
            {this.state.error?.message || 'Unknown error'}
          </code>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 2rem',
              background: 'linear-gradient(135deg, #00f5ff, #a855f7)',
              color: 'white',
              border: 'none',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
