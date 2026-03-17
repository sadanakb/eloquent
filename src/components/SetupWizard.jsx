import { useState, useEffect } from 'react';
import { getGroqKey, setGroqKey } from '../engine/ki-scorer.js';
import { Card } from './Card.jsx';
import { Button } from './Button.jsx';
import { Logo } from './Logo.jsx';
import { OrnamentDivider } from './Ornament.jsx';
import styles from './SetupWizard.module.css';

const STEPS = ['willkommen', 'groq', 'fertig'];

export function SetupWizard({ onComplete }) {
  const [step, setStep] = useState('willkommen');
  const [groqKey, setGroqKeyState] = useState('');
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqResult, setGroqResult] = useState(null);
  const [kiReady, setKiReady] = useState(false);

  useEffect(() => {
    const existing = getGroqKey();
    if (existing) {
      setGroqKeyState(existing);
      setKiReady(true);
    }
  }, []);

  const handleSaveGroq = () => {
    setGroqKey(groqKey);
    setKiReady(true);
    setGroqResult({ ok: true, msg: 'Gespeichert!' });
    setTimeout(() => setStep('fertig'), 800);
  };

  const handleTestGroq = async () => {
    if (!groqKey) return;
    setTestingGroq(true);
    setGroqResult(null);
    try {
      const res = await fetch('/api/groq/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: 'Antworte nur mit: OK' }],
          max_tokens: 5,
        }),
      });
      if (res.ok) {
        setGroqResult({ ok: true, msg: 'Groq funktioniert!' });
        setGroqKey(groqKey);
        setKiReady(true);
      } else {
        const err = await res.json().catch(() => ({}));
        setGroqResult({ ok: false, msg: err.error?.message || `Fehler ${res.status}` });
      }
    } catch (e) {
      setGroqResult({ ok: false, msg: e.message });
    }
    setTestingGroq(false);
  };

  const handleFinish = () => {
    localStorage.setItem('eloquent_setup_done', '1');
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('eloquent_setup_done', '1');
    onComplete();
  };

  return (
    <div className={`${styles.wrapper} texture-paper`}>
      <div className={styles.bgGlow} />

      <div className={`${styles.content} animate-slide`}>

        {/* Willkommen */}
        {step === 'willkommen' && (
          <Card glow ornate>
            <div className={styles.center}>
              <Logo />
              <OrnamentDivider />
              <p className={styles.subtitle}>Die Kunst der Sprache als Wettkampf.</p>
              <p className={styles.subtext}>
                Bevor du loslegst, richten wir die KI-Bewertung ein.
                Das dauert nur 1 Minute und macht das Spiel deutlich besser.
              </p>
              <div className={styles.actions}>
                <Button variant="gold" onClick={() => setStep('groq')}>KI einrichten</Button>
                <Button variant="ghost" onClick={handleSkip}>Ohne KI starten</Button>
              </div>
            </div>
          </Card>
        )}

        {/* Groq Setup */}
        {step === 'groq' && (
          <Card glow>
            <div style={{ padding: '12px 0' }}>
              <h2 className={styles.sectionTitle}>Groq einrichten</h2>

              <div className={styles.instructionBox}>
                <strong className={styles.instructionTitle}>So bekommst du einen kostenlosen API-Key:</strong>
                <ol style={{ margin: '8px 0 0 20px', padding: 0 }}>
                  <li style={{ marginBottom: 4 }}>
                    Gehe zu <a href="https://console.groq.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>console.groq.com</a>
                  </li>
                  <li style={{ marginBottom: 4 }}>Erstelle einen kostenlosen Account (keine Kreditkarte)</li>
                  <li style={{ marginBottom: 4 }}>Klicke „API Keys" → „Create API Key"</li>
                  <li>Kopiere den Schlüssel und füge ihn unten ein</li>
                </ol>
              </div>

              <label className={styles.inputLabel}>Groq API-Schlüssel</label>
              <input
                type="password"
                value={groqKey}
                onChange={e => setGroqKeyState(e.target.value)}
                placeholder="gsk_..."
                className={styles.input}
              />

              {groqResult && (
                <div className={groqResult.ok ? styles.resultOk : styles.resultError}>
                  {groqResult.msg}
                </div>
              )}

              <div className={styles.actions} style={{ marginTop: 16 }}>
                <Button variant="gold" onClick={handleTestGroq} disabled={!groqKey || testingGroq}>
                  {testingGroq ? 'Teste...' : 'Testen & Speichern'}
                </Button>
                {groqKey && groqResult?.ok && (
                  <Button variant="default" onClick={handleSaveGroq}>Weiter</Button>
                )}
              </div>

              <div style={{ textAlign: 'center' }}>
                <button className={styles.backLink} onClick={() => setStep('willkommen')}>Zurück</button>
              </div>
            </div>
          </Card>
        )}

        {/* Fertig */}
        {step === 'fertig' && (
          <Card glow ornate>
            <div className={styles.center}>
              <div className={styles.finishIcon}>{kiReady ? '\u2713' : '\u2714'}</div>
              <h2 className={styles.sectionTitle} style={{ fontSize: 28 }}>
                {kiReady ? 'KI ist bereit!' : 'Setup abgeschlossen'}
              </h2>
              <p className={styles.subtitle} style={{ maxWidth: 340 }}>
                {kiReady
                  ? 'Deine Texte werden jetzt mit echtem Sprachverständnis bewertet.'
                  : 'Du kannst die KI jederzeit über die Einstellungen aktivieren.'}
              </p>
              {kiReady && (
                <div className={styles.providerInfo}>
                  Groq (Llama 3.3 70B)
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                <Button variant="gold" onClick={handleFinish} style={{ fontSize: 17, padding: '14px 48px' }}>
                  Los geht's!
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Progress dots */}
        <div className={styles.dots}>
          {STEPS.map(s => (
            <div key={s} className={s === step ? styles.dotActive : styles.dot} />
          ))}
        </div>
      </div>
    </div>
  );
}
