import { useState } from 'react';
import { EinstellungenModal } from './EinstellungenModal.jsx';
import { Button } from './Button.jsx';

export function RequireGroqKeyPage({ onKeySet }) {
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
    // Let parent re-check whether the key is now set
    onKeySet?.();
  };

  return (
    <>
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          maxWidth: 460,
          margin: '0 auto',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <h2 style={{ marginBottom: 8 }}>Groq-API-Key benötigt</h2>
        <p style={{ color: 'var(--text-secondary, #888)', lineHeight: 1.6 }}>
          Für den Online-Modus brauchst du einen eigenen Groq-API-Key.
          Er wird für die faire KI-Bewertung beider Texte verwendet und
          verschlüsselt in deinem Profil gespeichert.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-500, #999)', marginBottom: 20 }}>
          Kostenlos auf{' '}
          <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--gold-500)' }}>
            console.groq.com/keys
          </a>{' '}
          erhältlich.
        </p>
        <Button onClick={() => setOpen(true)}>Key eintragen</Button>
      </div>
      {open && <EinstellungenModal onClose={handleClose} />}
    </>
  );
}
