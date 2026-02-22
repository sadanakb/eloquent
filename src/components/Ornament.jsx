import styles from './Ornament.module.css';

// SVG-Pfade für alle Ornament-Icons (Emoji-Ersatz)
const ICONS = {
  federn: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
      <path d="M16 8 2 22" />
      <path d="M17.5 15H9" />
    </svg>
  ),
  buch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h6" />
    </svg>
  ),
  lorbeer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V8" />
      <path d="M5 12s1-4 7-4" />
      <path d="M19 12s-1-4-7-4" />
      <path d="M5 8s2-4 7-3" />
      <path d="M19 8s-2-4-7-3" />
      <path d="M5 16s2 3 7 2" />
      <path d="M19 16s-2 3-7 2" />
      <circle cx="12" cy="5" r="2" />
    </svg>
  ),
  tintenfass: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3l-1 6h-4L9 3" />
      <rect x="6" y="9" width="12" height="10" rx="2" />
      <path d="M6 13h12" />
      <path d="M17 2l4 4" />
    </svg>
  ),
  ziel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  buchOffen: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
  feder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
      <path d="M16 8 2 22" />
    </svg>
  ),
  stern: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12,2 15,9 22,9.5 17,14.5 18.5,22 12,18 5.5,22 7,14.5 2,9.5 9,9" />
    </svg>
  ),
};

export function OrnamentIcon({ name, size = 'md', className = '', style = {} }) {
  const sizeClass = {
    sm: styles.iconSm,
    md: styles.iconMd,
    lg: styles.iconLg,
    xl: styles.iconXl,
  }[size] || styles.iconMd;

  return (
    <span className={`${styles.icon} ${sizeClass} ${className}`} style={style}>
      {ICONS[name] || ICONS.feder}
    </span>
  );
}

export function OrnamentDivider({ symbol = '✦' }) {
  return (
    <div className={styles.divider}>
      <div className={styles.dividerLine} />
      <span className={styles.dividerCenter}>{symbol}</span>
      <div className={styles.dividerLine} />
    </div>
  );
}
