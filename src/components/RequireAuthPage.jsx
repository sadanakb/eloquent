import { useState } from 'react';
import { AuthModal } from './AuthModal.jsx';
import { Button } from './Button.jsx';

export function RequireAuthPage({
  title = 'Anmeldung erforderlich',
  message = 'Melde dich an, um diese Funktion zu nutzen.',
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          maxWidth: 440,
          margin: '0 auto',
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
        }}
      >
        <h2 style={{ marginBottom: 8 }}>{title}</h2>
        <p style={{ marginBottom: 20, color: 'var(--text-secondary, #888)' }}>
          {message}
        </p>
        <Button onClick={() => setOpen(true)}>Jetzt anmelden</Button>
      </div>
      {open && <AuthModal onClose={() => setOpen(false)} />}
    </>
  );
}
