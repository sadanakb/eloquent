import eventBus from '../engine/event-bus.js';
import styles from './Button.module.css';

export function Button({ children, onClick, variant = 'default', disabled, style: s, className = '' }) {
  const variantClass = styles[variant] || styles.default;
  return (
    <button
      onClick={disabled ? undefined : (e) => {
        eventBus.emit('sound:play', { sound: 'click' });
        onClick?.(e);
      }}
      className={`${styles.btn} ${variantClass} ${disabled ? styles.disabled : ''} ${className}`}
      style={s}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
