import { useState, useEffect } from 'react';
import { hasAiProvider } from '../engine/ki-scorer.js';
import { EinstellungenModal } from './EinstellungenModal.jsx';
import { LogoCompact } from './Logo.jsx';
import styles from './NavBar.module.css';

export function NavBar({ current, onNavigate }) {
  const [showSettings, setShowSettings] = useState(false);
  const [aiActive, setAiActive] = useState(false);

  useEffect(() => {
    setAiActive(hasAiProvider());
  }, []);

  const refreshAiStatus = () => {
    setAiActive(hasAiProvider());
  };

  const navItems = [
    { id: 'duell', label: 'Duell' },
    { id: 'uebung', label: 'Übung' },
    { id: 'woerterbuch', label: 'Wörter' },
    { id: 'rangliste', label: 'Rangliste' },
  ];

  return (
    <>
      <nav className={styles.nav}>
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
          <button
            onClick={() => setShowSettings(true)}
            className={styles.settingsBtn}
            title="Einstellungen"
          >
            &#9881;
          </button>
        </div>
      </nav>
      {showSettings && (
        <EinstellungenModal onClose={() => { setShowSettings(false); refreshAiStatus(); }} />
      )}
    </>
  );
}
