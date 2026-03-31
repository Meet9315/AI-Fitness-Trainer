/**
 * useWebSocket Hook
 * =================
 * Manages WebSocket connection to the FastAPI backend.
 * Handles auto-reconnect, message sending, and state management.
 * 
 * Returns:
 *   - isConnected: boolean
 *   - feedback: latest feedback response from backend
 *   - sendLandmarks: function to send landmark data
 *   - setExercise: function to switch exercise
 *   - resetExercise: function to reset exercise state
 *   - getSummary: function to request performance summary
 *   - summary: latest performance summary
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = `ws://${window.location.hostname}:8000/ws`;
const RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 10000;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [summary, setSummary] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectDelayRef = useRef(RECONNECT_DELAY);

  const connect = useCallback(() => {
    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('[WS] Connected to backend');
        setIsConnected(true);
        reconnectDelayRef.current = RECONNECT_DELAY; // Reset delay
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'feedback') {
            setFeedback(data);
          } else if (data.type === 'summary') {
            setSummary(data);
          } else if (data.type === 'exercise_changed') {
            // Reset feedback on exercise change
            setFeedback(prev => prev ? { ...prev, rep_count: 0, phase: 'idle', feedback: [] } : null);
          }
        } catch (err) {
          console.error('[WS] Parse error:', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setIsConnected(false);
        wsRef.current = null;

        // Auto-reconnect with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(
            reconnectDelayRef.current * 1.5,
            MAX_RECONNECT_DELAY
          );
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Connection failed:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  // Keepalive ping every 30 seconds
  useEffect(() => {
    if (!isConnected) return;
    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    return () => clearInterval(pingInterval);
  }, [isConnected]);

  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const sendLandmarks = useCallback((landmarks) => {
    sendMessage({
      type: 'landmarks',
      landmarks: landmarks,
      timestamp: Date.now(),
    });
  }, [sendMessage]);

  const setExercise = useCallback((exercise) => {
    sendMessage({
      type: 'set_exercise',
      exercise: exercise,
    });
  }, [sendMessage]);

  const resetExercise = useCallback(() => {
    sendMessage({ type: 'reset' });
    setFeedback(prev => prev ? { ...prev, rep_count: 0, phase: 'idle', feedback: [], angles: [] } : null);
  }, [sendMessage]);

  const getSummary = useCallback(() => {
    sendMessage({ type: 'get_summary' });
  }, [sendMessage]);

  return {
    isConnected,
    feedback,
    summary,
    sendLandmarks,
    setExercise,
    resetExercise,
    getSummary,
  };
}
