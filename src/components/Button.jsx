// src/components/Button.jsx
import eventBus from '../engine/event-bus.js';
import styles from './Button.module.css';

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  style: s,
  className = '',
  type = 'button',
}) {
  const cls = [
    styles.btn,
    styles[variant] || styles.primary,
    styles[`size-${size}`],
    disabled ? styles.disabled : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={disabled ? undefined : (e) => {
        eventBus.emit('sound:play', { sound: 'click' });
        onClick?.(e);
      }}
      className={cls}
      style={s}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
