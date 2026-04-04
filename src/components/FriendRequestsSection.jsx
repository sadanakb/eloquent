// src/components/FriendRequestsSection.jsx
import styles from './FriendRequestsSection.module.css';

export function FriendRequestsSection({ requests = [], onAccept, onDecline, loading }) {
  if (loading) {
    return (
      <div className={styles.section}>
        <p className={styles.loading}>Laden...</p>
      </div>
    );
  }

  if (requests.length === 0) return null;

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Anfragen ({requests.length})</h3>
      </div>

      <ul className={styles.list}>
        {requests.map((req) => (
          <li key={req.id} className={styles.row}>
            <div className={styles.avatar}>
              {req.avatar_url ? (
                <img src={req.avatar_url} alt={req.username} />
              ) : (
                (req.username || '?')[0].toUpperCase()
              )}
            </div>
            <div className={styles.info}>
              <div className={styles.username}>{req.username}</div>
              <div className={styles.elo}>ELO {req.elo_rating ?? '—'}</div>
            </div>
            <div className={styles.actions}>
              <button
                className={styles.acceptBtn}
                onClick={() => onAccept?.(req.friendshipId)}
              >
                ✓ Annehmen
              </button>
              <button
                className={styles.declineBtn}
                onClick={() => onDecline?.(req.friendshipId)}
              >
                ✗ Ablehnen
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
