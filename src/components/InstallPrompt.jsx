import { useState, useEffect, useRef } from 'react';
import { Button } from './Button';
import storage from '../engine/storage';
import styles from './InstallPrompt.module.css';

const DISMISS_KEY = 'pwa_install_dismissed';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef(null);

  useEffect(() => {
    if (storage.get(DISMISS_KEY, false)) return;

    const handler = (e) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setShow(false);
      deferredPrompt.current = null;
    };

    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === 'accepted') {
      setShow(false);
    }
    deferredPrompt.current = null;
  };

  const handleDismiss = () => {
    setShow(false);
    storage.set(DISMISS_KEY, true);
    deferredPrompt.current = null;
  };

  if (!show) return null;

  return (
    <div className={styles.banner}>
      <span className={styles.text}>Eloquent installieren</span>
      <div className={styles.actions}>
        <Button variant="gold" onClick={handleInstall} className={styles.installBtn}>
          Installieren
        </Button>
        <button className={styles.dismissBtn} onClick={handleDismiss} aria-label="Schließen">
          ✕
        </button>
      </div>
    </div>
  );
}
