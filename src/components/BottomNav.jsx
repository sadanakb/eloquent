import styles from './BottomNav.module.css';

/* ── Inline SVG Icons ── */
const IconTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const IconPerson = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconQuill = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5l6.74-6.76z" />
    <path d="M16 8 2 22" />
    <path d="M17.5 15H9" />
  </svg>
);

const IconSwords = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5 3 6V3h3l11.5 11.5" />
    <path d="M13 19l6-6" />
    <path d="M16 16l4 4" />
    <path d="M9.5 6.5 21 18v3h-3L6.5 9.5" />
    <path d="M11 5l-6 6" />
    <path d="M8 8 4 4" />
  </svg>
);

const IconBook = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

const TAB_ICONS = {
  uebung: IconTarget,
  profil: IconPerson,
  home: IconQuill,
  duell: IconSwords,
  story: IconBook,
};

const TABS = [
  { id: 'uebung', label: 'Üben', ariaLabel: 'Üben' },
  { id: 'profil', label: 'Profil', ariaLabel: 'Profil' },
  { id: 'home', label: 'Home', ariaLabel: 'Startseite', isCenter: true },
  { id: 'duell', label: 'Duell', ariaLabel: 'Online Duell' },
  { id: 'story', label: 'Story', ariaLabel: 'Story-Modus' },
];

export function BottomNav({ activePage, onNavigate }) {
  return (
    <nav className={styles.bottomNav} role="navigation" aria-label="Hauptnavigation">
      {TABS.map((tab) => {
        const isActive = tab.id === activePage;
        const Icon = TAB_ICONS[tab.id];
        return (
          <button
            key={tab.id}
            className={`${styles.tab} ${isActive ? styles.tabActive : ''} ${tab.isCenter ? styles.tabCenter : ''}`}
            onClick={() => onNavigate(tab.id)}
            aria-label={tab.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.tabIcon}>
              <Icon />
            </span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
