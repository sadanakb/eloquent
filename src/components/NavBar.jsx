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
    { id: 'duell', label: 'Duell' },
    { id: 'online', label: 'Online' },
    { id: 'story', label: 'Story' },
    { id: 'uebung', label: 'Übung' },
    { id: 'woerterbuch', label: 'Wörter' },
    { id: 'rangliste', label: 'Rangliste' },
  ];

  return (
    <>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
        <LogoCompact onClick={() => onNavigate('home')} />

        <div className={styles.links}>
          {navItems.map(n => (
            <button
              key={n.id}
              onClick={() => onNavigate(n.id)}
              className={current === n.id ? styles.linkActive : styles.link}
            >
              {n.label}
            </button>
          ))}
        </div>

        <div className={styles.right}>
          {aiActive && <span className={styles.kiBadge}>KI</span>}
          {isAuthenticated ? (
            <button
              onClick={() => onNavigate('profil')}
              className={styles.profileBtn}
              title="Profil"
            >
              {user?.user_metadata?.full_name?.[0] || '?'}
            </button>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className={styles.authBtn}
              title="Anmelden"
            >
              Anmelden
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className={styles.settingsBtn}
            title="Einstellungen"
          >
            ⚙
          </button>
        </div>
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
