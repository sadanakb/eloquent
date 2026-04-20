import React from 'react';
import styles from './ErrorBoundary.module.css';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ELOQUENT] Render-Fehler:', error, info.componentStack);
    this.setState({ info });
  }

  handleClearCacheAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Private mode / quota — ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const err = this.state.error;
      const info = this.state.info;
      const errorText = err ? (err.message || String(err)) : 'Unbekannter Fehler';
      const stackText = err?.stack || '';
      const componentStack = info?.componentStack || '';
      return (
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.ornament}>&#10086;</div>
            <h1 className={styles.title}>Etwas ist schiefgelaufen</h1>
            <div className={styles.divider} />
            <p className={styles.message}>
              Ein unerwarteter Fehler ist aufgetreten. Bitte versuche die Seite neu zu laden.
              Falls der Fehler bleibt, hilft „Daten l&ouml;schen &amp; neu starten".
            </p>

            <details style={{
              textAlign: 'left',
              maxWidth: 520,
              margin: '12px auto 20px',
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
              padding: '10px 12px',
              fontSize: 12,
              color: '#555',
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Fehlerdetails
              </summary>
              <div style={{ marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'ui-monospace, monospace' }}>
                <strong>Meldung:</strong> {errorText}
                {stackText && (
                  <>
                    <br /><br />
                    <strong>Stack:</strong>
                    <br />{stackText.split('\n').slice(0, 8).join('\n')}
                  </>
                )}
                {componentStack && (
                  <>
                    <br /><br />
                    <strong>Komponenten:</strong>
                    <br />{componentStack.split('\n').slice(0, 6).join('\n')}
                  </>
                )}
              </div>
            </details>

            <button
              className={styles.reloadButton}
              onClick={() => window.location.reload()}
            >
              Seite neu laden
            </button>
            <button
              className={styles.reloadButton}
              style={{ marginTop: 8, background: 'transparent', color: 'var(--accent-error, #c04)', border: '1px solid rgba(200,0,60,0.3)' }}
              onClick={this.handleClearCacheAndReload}
            >
              Daten l&ouml;schen &amp; neu starten
            </button>
            <a
              href="/"
              className={styles.homeLink}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/';
              }}
            >
              Zur&uuml;ck zur Startseite
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
