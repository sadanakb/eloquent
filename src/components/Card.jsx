import styles from './Card.module.css';

export function Card({ children, style: s, glow, onClick, ornate, className = '' }) {
  const classes = [
    ornate ? styles.ornate : styles.card,
    glow ? styles.glow : '',
    onClick ? styles.clickable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div onClick={onClick} className={classes} style={s}>
      {children}
    </div>
  );
}
