import { useState } from 'react';
import { OrnamentIcon } from './Ornament';
import styles from './BottomNav.module.css';

const TABS = [
  { id: 'home', label: 'Home', icon: 'federn', useOrnament: true },
  { id: 'duell', label: 'Duell', icon: '\u2694', useOrnament: false },
  { id: 'uebung', label: '\u00dcbung', icon: 'buch', useOrnament: true },
  { id: 'story', label: 'Story', icon: 'buchOffen', useOrnament: true },
  { id: 'mehr', label: 'Mehr', icon: '\u00B7\u00B7\u00B7', useOrnament: false },
];

const DRAWER_ITEMS = [
  { id: 'online', label: 'Online Match' },
  { id: 'woerterbuch', label: 'W\u00f6rter' },
  { id: 'rangliste', label: 'Rangliste' },
  { id: 'achievements', label: 'Errungenschaften' },
  { id: 'profil', label: 'Profil' },
  { id: 'regeln', label: 'Regeln' },
  { id: 'einstellungen', label: 'Einstellungen' },
];

export function BottomNav({ activePage, onNavigate, onOpenSettings }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleTab = (id) => {
    if (id === 'mehr') {
      setDrawerOpen((prev) => !prev);
    } else {
      setDrawerOpen(false);
      onNavigate(id);
    }
  };

  const handleDrawerItem = (id) => {
    if (id === 'einstellungen') {
      setDrawerOpen(false);
      onOpenSettings?.();
      return;
    }
    setDrawerOpen(false);
    onNavigate(id);
  };

  return (
    <>
      {/* Drawer overlay */}
      {drawerOpen && (
        <div className={styles.backdrop} onClick={() => setDrawerOpen(false)}>
          <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
            {DRAWER_ITEMS.map((item) => (
              <button
                key={item.id}
                className={styles.drawerItem}
                onClick={() => handleDrawerItem(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className={styles.nav}>
        {TABS.map((tab) => {
          const isActive = tab.id === activePage || (tab.id === 'mehr' && drawerOpen);
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
              onClick={() => handleTab(tab.id)}
            >
              <span className={styles.tabIcon}>
                {tab.useOrnament ? (
                  <OrnamentIcon name={tab.icon} size="sm" />
                ) : (
                  <span className={styles.textIcon}>{tab.icon}</span>
                )}
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
