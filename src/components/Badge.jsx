import styles from './Badge.module.css';

export function Badge({ children, style: s, className = '' }) {
  return (
    <span className={`${styles.badge} ${className}`} style={s}>
      {children}
    </span>
  );
}
