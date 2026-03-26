/**
 * Loading placeholder shown during lazy page loading.
 * Matches the Eloquent theme with paper texture and gold accents.
 */

import styles from './PageLoader.module.css';

export function PageLoader() {
  return (
    <div className={styles.container} role="status" aria-busy="true" aria-label="Seite wird geladen">
      <div className={styles.content}>
        <div className={styles.logo}>E</div>
        <div className={styles.text}>Laden…</div>
      </div>
    </div>
  );
}
