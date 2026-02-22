import React from 'react';

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
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 32, textAlign: 'center',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <div>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>Etwas ist schiefgelaufen</h1>
            <p style={{ fontSize: 14, color: '#666', marginBottom: 24 }}>
              {this.state.error?.message || 'Ein unerwarteter Fehler ist aufgetreten.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', fontSize: 14, cursor: 'pointer',
                border: '1px solid #ccc', borderRadius: 6, background: '#fff',
              }}
            >
              Neu laden
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
