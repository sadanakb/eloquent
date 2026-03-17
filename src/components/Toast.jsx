import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import eventBus from '../engine/event-bus.js';
import { OrnamentIcon } from './Ornament.jsx';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const MAX_VISIBLE = 3;
const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const queueRef = useRef([]);
  const counterRef = useRef(0);

  const processQueue = useCallback(() => {
    setToasts(prev => {
      if (prev.length >= MAX_VISIBLE || queueRef.current.length === 0) return prev;

      const toAdd = queueRef.current.splice(0, MAX_VISIBLE - prev.length);
      return [...prev, ...toAdd];
    });
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
    // After removal, try to show queued toasts
    setTimeout(processQueue, 100);
  }, [processQueue]);

  const showToast = useCallback((achievement) => {
    counterRef.current += 1;
    const toast = {
      id: `toast_${counterRef.current}`,
      achievement,
      timestamp: Date.now(),
    };

    queueRef.current.push(toast);
    processQueue();
  }, [processQueue]);

  // Auto-dismiss toasts
  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map(t => {
      const elapsed = Date.now() - t.timestamp;
      const remaining = Math.max(AUTO_DISMISS_MS - elapsed, 0);
      return setTimeout(() => removeToast(t.id), remaining);
    });

    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  // Listen for achievement:unlocked events from the event bus
  useEffect(() => {
    const unsub = eventBus.on('achievement:unlocked', (e) => {
      showToast(e.detail);
    });
    return unsub;
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className={styles.container} aria-live="polite">
        {toasts.map((t, i) => (
          <div
            key={t.id}
            className={styles.toast}
            style={{ '--toast-index': i }}
            onClick={() => removeToast(t.id)}
          >
            <div className={styles.iconWrap}>
              <OrnamentIcon name={t.achievement.icon} size="md" />
            </div>
            <div className={styles.content}>
              <div className={styles.label}>Erfolg freigeschaltet</div>
              <div className={styles.name}>{t.achievement.name}</div>
              <div className={styles.description}>{t.achievement.description}</div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
