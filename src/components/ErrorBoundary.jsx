import React from 'react';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ELOQUENT] Render-Fehler:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.ornament}>&#10086;</div>
            <h1 className={styles.title}>Etwas ist schiefgelaufen</h1>
            <div className={styles.divider} />
            <p className={styles.message}>
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche die Seite neu zu laden.
            </p>
            <button
              className={styles.reloadButton}
              onClick={() => window.location.reload()}
            >
              Seite neu laden
            </button>
            <a
              href="/"
              className={styles.homeLink}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/';
              }}
            >
              Zurück zur Startseite
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
