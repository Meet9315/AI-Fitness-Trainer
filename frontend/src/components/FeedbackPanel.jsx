/**
 * FeedbackPanel Component
 * =======================
 * Real-time scrolling feedback messages with color-coded severity.
 */

import React, { useEffect, useRef, useState } from 'react';

const MAX_MESSAGES = 8;

export default function FeedbackPanel({ feedback, resetKey }) {
  const [messages, setMessages] = useState([]);
  const listRef = useRef(null);
  const idCounterRef = useRef(0);

  // Clear messages when resetKey changes (exercise switch or reset)
  useEffect(() => {
    setMessages([]);
  }, [resetKey]);

  // Append new feedback messages
  useEffect(() => {
    if (!feedback || feedback.length === 0) return;

    setMessages((prev) => {
      const newMsgs = feedback.map((f) => ({
        ...f,
        id: idCounterRef.current++,
        timestamp: Date.now(),
      }));

      // Deduplicate by message text (keep latest)
      const combined = [...prev, ...newMsgs];
      const seen = new Map();
      for (const msg of combined) {
        seen.set(msg.message, msg);
      }

      const unique = Array.from(seen.values());
      return unique.slice(-MAX_MESSAGES);
    });
  }, [feedback]);

  // Auto-scroll to latest
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="feedback-panel glass-card" id="feedback-panel">
      <div className="feedback-panel__label">Live Feedback</div>

      {messages.length === 0 ? (
        <div className="feedback-panel__empty">
          Start exercising to receive form feedback...
        </div>
      ) : (
        <div className="feedback-panel__list" ref={listRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`feedback-panel__item feedback-panel__item--${msg.level}`}
            >
              {msg.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
