// src/components/Badge.jsx
import styles from './Badge.module.css';

export function Badge({ children, type = 'category', active = false, className = '' }) {
  const cls = [styles.badge, styles[type], active ? styles.active : '', className]
    .filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
