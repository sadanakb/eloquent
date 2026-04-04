// src/components/AddFriendModal.jsx
import { useState, useEffect, useCallback } from 'react';
import { Input } from './Input.jsx';
import styles from './AddFriendModal.module.css';

export function AddFriendModal({ isOpen, onClose, onSendRequest, onSearchUsers, myFriendCode }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [copied, setCopied] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSearching(false);
      setSentIds(new Set());
      setCopied(false);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await onSearchUsers(query);
        setResults(res || []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearchUsers]);

  const handleCopy = useCallback(() => {
    if (!myFriendCode) return;
    navigator.clipboard.writeText(myFriendCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [myFriendCode]);

  const handleSend = useCallback(async (userId) => {
    try {
      await onSendRequest(userId);
      setSentIds((prev) => new Set(prev).add(userId));
    } catch {
      // handled by parent
    }
  }, [onSendRequest]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeX} onClick={onClose} aria-label="Schließen">
          ✕
        </button>

        <h2 className={styles.title}>Freund hinzufügen</h2>

        {myFriendCode && (
          <div className={styles.codeSection}>
            <span className={styles.codeLabel}>Dein Code:</span>
            <span className={styles.codeValue}>#{myFriendCode}</span>
            <button
              className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
              aria-label="Code kopieren"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
        )}

        <div className={styles.searchWrapper}>
          <Input
            label="Suche nach Benutzername oder #Code"
            placeholder="z.B. MaxMuster oder #ABC123"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {searching && <p className={styles.statusText}>Suche...</p>}

        {!searching && query.length >= 2 && results.length === 0 && (
          <p className={styles.statusText}>Keine Ergebnisse</p>
        )}

        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map((user) => (
              <li key={user.id} className={styles.resultRow}>
                <div className={styles.avatar}>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.username} />
                  ) : (
                    (user.username || '?')[0].toUpperCase()
                  )}
                </div>
                <div className={styles.resultInfo}>
                  <div className={styles.resultName}>{user.username}</div>
                  <div className={styles.resultElo}>ELO {user.elo ?? '—'}</div>
                </div>
                {sentIds.has(user.id) ? (
                  <span className={styles.sentBtn}>Gesendet ✓</span>
                ) : (
                  <button
                    className={styles.sendBtn}
                    onClick={() => handleSend(user.id)}
                  >
                    Anfrage senden
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
