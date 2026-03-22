import { useState, useEffect } from 'react';
import { getGroqKey, setGroqKey, getAiStatus, migrateFromGemini } from '../engine/ki-scorer.js';
import soundManager from '../engine/sound-manager.js';
import styles from './EinstellungenModal.module.css';

export function EinstellungenModal({ onClose }) {
  const [groqKey, setGroqKeyState] = useState('');
  const [saved, setSaved] = useState(false);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqResult, setGroqResult] = useState(null);

  const [theme, setTheme] = useState(
    document.documentElement.dataset.theme || 'light'
  );

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  useEffect(() => {
    migrateFromGemini();
    const existing = getGroqKey();
    if (existing) setGroqKeyState(existing);
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
    setGroqKey(groqKey.trim());
    setTestingGroq(true);
    setGroqResult(null);
    try {
      // GET /models — simplest key validation, no model dependency
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${groqKey.trim()}` },
      });
      if (res.ok) {
        const data = await res.json();
        const count = data?.data?.length ?? '?';
        setGroqResult({ ok: true, msg: `Groq API aktiv — ${count} Modelle verfügbar` });
      } else {
        const errText = await res.text();
        let errMsg = `Fehler ${res.status}`;
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error?.message || errMsg;
        } catch {
          if (errText) errMsg += `: ${errText.slice(0, 200)}`;
        }
        setGroqResult({ ok: false, msg: errMsg });
      }
    } catch (e) {
      setGroqResult({ ok: false, msg: `Netzwerkfehler: ${e.message}` });
    }
    setTestingGroq(false);
  };

  const hasAny = !!groqKey;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modal}>
        <button className={styles.closeX} onClick={onClose} aria-label="Schließen">&times;</button>
        <h2 className={styles.title}>Einstellungen</h2>

        {/* Erscheinungsbild */}
        <div className={styles.settingRow}>
          <div className={styles.settingLabel}>
            <span className={styles.settingTitle}>Erscheinungsbild</span>
            <span className={styles.settingDesc}>Hell oder dunkel</span>
          </div>
          <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Erscheinungsbild wechseln">
            {theme === 'dark' ? '☀' : '☾'}
            <span>{theme === 'dark' ? 'Hell' : 'Dunkel'}</span>
          </button>
        </div>

        {/* Status Banner */}
        <div className={hasAny ? styles.statusOk : styles.statusWarn}>
          {hasAny
            ? 'KI-Bewertung aktiv — Texte werden mit echtem Sprachverständnis bewertet.'
            : 'Heuristik-Modus — Bewertung basiert auf Regeln. Für bessere Ergebnisse: KI aktivieren.'}
        </div>

        {/* Groq Section */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Groq Cloud (Kostenlos)</h3>
            <span className={styles.recommendBadge}>EMPFOHLEN</span>
          </div>
          <p className={styles.sectionDesc}>
            Groq nutzt Llama 3.3 70B — exzellent für Deutsch. Kostenlos, 14.400 Bewertungen/Tag.
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
              <li>Klicke „API Keys" → „Create API Key"</li>
              <li>Kopiere den Schlüssel und füge ihn hier ein</li>
            </ol>
          </div>
        </div>

        {/* Sound-Einstellungen */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Ton</h3>
          <p className={styles.sectionDesc}>Steuere die Audioausgabe des Spiels.</p>
          <div className={styles.btnRow}>
            <button
              onClick={() => soundManager.toggleSound()}
              className={soundManager.isSoundEnabled() ? styles.smallBtnGold : styles.smallBtnGhost}
            >
              {soundManager.isSoundEnabled() ? 'UI-Sounds: An' : 'UI-Sounds: Aus'}
            </button>
            <button
              onClick={() => soundManager.toggleMusic()}
              className={soundManager.isMusicEnabled() ? styles.smallBtnGold : styles.smallBtnGhost}
            >
              {soundManager.isMusicEnabled() ? 'Musik: An' : 'Musik: Aus'}
            </button>
          </div>
        </div>

        <button onClick={onClose} className={styles.closeBtn}>Schließen</button>
      </div>
    </div>
  );
}
