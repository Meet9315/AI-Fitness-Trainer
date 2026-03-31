/**
 * useSoundEffects Hook
 * ====================
 * Plays a chime sound when rep count increases.
 * Uses the Web Audio API for zero-latency audio feedback.
 */

import { useEffect, useRef, useCallback } from 'react';

export function useSoundEffects() {
  const audioCtxRef = useRef(null);
  const prevRepCountRef = useRef(0);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtxRef.current;
  }, []);

  const playRepChime = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create a pleasant two-tone chime
      const now = ctx.currentTime;

      // First tone (higher pitch)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Second tone (octave higher, slight delay)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, now + 0.08); // E6
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.2, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.25);
    } catch (err) {
      // Audio not available, fail silently
      console.warn('[Sound] Could not play chime:', err.message);
    }
  }, [getAudioContext]);

  const playGoalComplete = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // Triumphant 3-note fanfare
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.12);
        gain.gain.setValueAtTime(0, now);
        gain.gain.setValueAtTime(0.3, now + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.12);
        osc.stop(now + i * 0.12 + 0.3);
      });
    } catch (err) {
      console.warn('[Sound] Could not play fanfare:', err.message);
    }
  }, [getAudioContext]);

  const onRepChange = useCallback((newCount) => {
    if (newCount > prevRepCountRef.current && newCount > 0) {
      playRepChime();
    }
    prevRepCountRef.current = newCount;
  }, [playRepChime]);

  return {
    onRepChange,
    playRepChime,
    playGoalComplete,
  };
}
