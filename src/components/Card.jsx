// src/components/Card.jsx
import styles from './Card.module.css';

export function Card({
  children,
  featured = false,
  clickable = false,
  onClick,
  className = '',
  style: s,
  glow,
  ornate,
}) {
  const cls = [
    ornate ? styles.ornate : styles.card,
    featured ? styles.featured : '',
    glow ? styles.glow : '',
    clickable || onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={cls} style={s} onClick={onClick} role={onClick ? 'button' : undefined}>
      {children}
    </div>
  );
}
