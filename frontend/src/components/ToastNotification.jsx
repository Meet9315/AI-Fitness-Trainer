/**
 * ToastNotification Component
 * ===========================
 * Floating toast that appears for connection status changes.
 * Auto-dismisses after a timeout.
 */

import React, { useState, useEffect, useRef } from 'react';

export default function ToastNotification({ isConnected }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);
  const prevConnectedRef = useRef(isConnected);
  const timerRef = useRef(null);

  useEffect(() => {
    // Only show toast on status CHANGE, not on initial mount
    if (prevConnectedRef.current !== isConnected && prevConnectedRef.current !== undefined) {
      const message = isConnected
        ? { text: '✅ Connected to server', type: 'success' }
        : { text: '❌ Disconnected from server — retrying...', type: 'error' };

      setToast(message);
      setVisible(true);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setToast(null), 300);
      }, 3000);
    }
    prevConnectedRef.current = isConnected;
  }, [isConnected]);

  if (!toast) return null;

  return (
    <div
      className={`toast toast--${toast.type} ${visible ? 'toast--visible' : 'toast--hidden'}`}
      id="toast-notification"
    >
      {toast.text}
    </div>
  );
}
