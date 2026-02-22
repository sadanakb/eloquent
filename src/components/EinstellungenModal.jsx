import { useState, useEffect } from 'react';
import { checkOllama, getGroqKey, setGroqKey, getAiStatus, migrateFromGemini } from '../engine/ki-scorer.js';
import styles from './EinstellungenModal.module.css';

export function EinstellungenModal({ onClose }) {
  const [groqKey, setGroqKeyState] = useState('');
  const [saved, setSaved] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqResult, setGroqResult] = useState(null);

  useEffect(() => {
    migrateFromGemini();
    const existing = getGroqKey();
    if (existing) setGroqKeyState(existing);
    checkOllama().then(result => setOllamaStatus(result));
  }, []);

  const handleSaveGroq = () => {
    setGroqKey(groqKey);
    setSaved(true);
    setGroqResult(null);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleRemoveGroq = () => {
    setGroqKey('');
    setGroqKeyState('');
    setGroqResult(null);
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
        setGroqResult({ ok: true, msg: 'Groq API funktioniert! (Llama 3.3 70B)' });
      } else {
        const err = await res.json().catch(() => ({}));
        setGroqResult({ ok: false, msg: err.error?.message || `Fehler ${res.status}` });
      }
    } catch (e) {
      setGroqResult({ ok: false, msg: e.message });
    }
    setTestingGroq(false);
  };

  const handleRefreshOllama = async () => {
    setOllamaStatus(null);
    const result = await checkOllama();
    setOllamaStatus(result);
  };

  const hasAny = ollamaStatus?.available || !!groqKey;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modal}>
        <h2 className={styles.title}>Einstellungen</h2>

        {/* Status Banner */}
        <div className={hasAny ? styles.statusOk : styles.statusWarn}>
          {hasAny
            ? 'KI-Bewertung aktiv \u2014 Texte werden mit echtem Sprachverständnis bewertet.'
            : 'Heuristik-Modus \u2014 Bewertung basiert auf Regeln. Für bessere Ergebnisse: KI aktivieren.'}
        </div>

        {/* Ollama Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Option 1: Ollama (Lokal)</h3>
            <span className={styles.recommendBadge}>EMPFOHLEN</span>
          </div>
          <p className={styles.sectionDesc}>
            Ollama läuft lokal auf deinem Mac \u2014 kostenlos, privat, kein API-Key nötig.
          </p>

          <div className={ollamaStatus?.available ? styles.ollamaOk : styles.ollamaPending}>
            {ollamaStatus === null
              ? 'Suche Ollama...'
              : ollamaStatus.available
                ? <>Ollama aktiv! Modell: <strong>{ollamaStatus.model}</strong></>
                : <>
                    Ollama nicht gefunden.
                    <button onClick={handleRefreshOllama} className={styles.retryBtn}>Erneut prüfen</button>
                  </>}
          </div>

          {!ollamaStatus?.available && (
            <div className={styles.instructionBox}>
              <strong className={styles.instructionTitle}>So installierst du Ollama:</strong>
              <ol style={{ margin: '6px 0 0 20px', padding: 0 }}>
                <li>Gehe zu <a href="https://ollama.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>ollama.com</a> und installiere die App</li>
                <li>Öffne Terminal: <code style={{ background: 'var(--bg-inset)', padding: '1px 6px', borderRadius: 3 }}>ollama pull llama3.2</code></li>
                <li>Klicke oben auf &quot;Erneut prüfen&quot;</li>
              </ol>
            </div>
          )}
        </div>

        {/* Groq Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Option 2: Groq Cloud (Kostenlos)</h3>
          <p className={styles.sectionDesc}>
            Groq nutzt Llama 3.3 70B \u2014 exzellent für Deutsch. Kostenlos, 14.400 Bewertungen/Tag.
          </p>

          <label className={styles.inputLabel}>Groq API-Schlüssel</label>
          <input
            type="password"
            value={groqKey}
            onChange={e => setGroqKeyState(e.target.value)}
            placeholder="gsk_..."
            className={styles.input}
          />

          <div className={styles.btnRow}>
            <button onClick={handleSaveGroq} className={styles.smallBtnGold}>
              {saved ? 'Gespeichert!' : 'Speichern'}
            </button>
            <button onClick={handleTestGroq} disabled={!groqKey || testingGroq} className={styles.smallBtnGhost}>
              {testingGroq ? 'Teste...' : 'Testen'}
            </button>
            {groqKey && (
              <button onClick={handleRemoveGroq} className={styles.smallBtnDanger}>Entfernen</button>
            )}
          </div>

          {groqResult && (
            <div className={groqResult.ok ? styles.resultOk : styles.resultError}>
              {groqResult.msg}
            </div>
          )}

          <div className={styles.instructionBox}>
            <strong className={styles.instructionTitle}>So bekommst du einen kostenlosen Groq-Key:</strong>
            <ol style={{ margin: '6px 0 0 20px', padding: 0 }}>
              <li>Gehe zu <a href="https://console.groq.com" target="_blank" rel="noopener" style={{ color: 'var(--accent-gold)', textDecoration: 'underline' }}>console.groq.com</a></li>
              <li>Erstelle einen kostenlosen Account (keine Kreditkarte nötig)</li>
              <li>Klicke &quot;API Keys&quot; &rarr; &quot;Create API Key&quot;</li>
              <li>Kopiere den Schlüssel und füge ihn hier ein</li>
            </ol>
          </div>
        </div>

        <button onClick={onClose} className={styles.closeBtn}>Schließen</button>
      </div>
    </div>
  );
}
