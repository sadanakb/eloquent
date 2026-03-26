import { useState, useEffect } from 'react';
import { hasAiProvider } from '../engine/ki-scorer.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import { EinstellungenModal } from './EinstellungenModal.jsx';
import { AuthModal } from './AuthModal.jsx';
import { LogoCompact } from './Logo.jsx';
import styles from './NavBar.module.css';

export function NavBar({ current, onNavigate }) {
  const [showSettings, setShowSettings] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    setAiActive(hasAiProvider());
  }, []);

  const refreshAiStatus = () => {
    setAiActive(hasAiProvider());
  };

  const navItems = [
    { id: 'duell', label: 'Duell', ariaLabel: 'Duell-Modus' },
    { id: 'online', label: 'Online', ariaLabel: 'Online Match' },
    { id: 'story', label: 'Story', ariaLabel: 'Story-Modus' },
    { id: 'uebung', label: 'Übung', ariaLabel: 'Übungsmodus' },
    { id: 'woerterbuch', label: 'Wörter', ariaLabel: 'Wörterbuch' },
    { id: 'rangliste', label: 'Rangliste', ariaLabel: 'Rangliste anzeigen' },
  ];

  return (
    <>
      <nav className={styles.navbar}>
        <LogoCompact onClick={() => onNavigate('home')} />

        <div className={styles.nav}>
          {navItems.map(n => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={`${styles.navLink}${current === n.id ? ` ${styles.navLinkActive}` : ''}`}
              aria-label={n.ariaLabel}
              aria-current={current === n.id ? 'page' : undefined}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className={styles.right}>
          {aiActive && <span className={styles.aiBadge}>KI</span>}
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('profil')}
              className={styles.avatarBtn}
              title="Profil"
            >
              {user?.user_metadata?.full_name?.[0] || '?'}
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className={styles.avatarBtn}
              title="Anmelden"
            >
              ?
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className={styles.iconBtn}
            title="Einstellungen"
          >
            ⚙
          </button>
        </div>
      </nav>
      {showSettings && (
        <EinstellungenModal onClose={() => { setShowSettings(false); refreshAiStatus(); }} />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}
