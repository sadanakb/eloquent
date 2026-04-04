// src/components/FriendListSection.jsx
import styles from './FriendListSection.module.css';

export function FriendListSection({ friends = [], onChallenge, onRemove, onAddClick, loading }) {
  if (loading) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <h3 className={styles.headerTitle}>Freunde</h3>
        </div>
        <p className={styles.loading}>Laden...</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h3 className={styles.headerTitle}>Freunde ({friends.length})</h3>
        <button className={styles.addBtn} onClick={onAddClick} aria-label="Freund hinzufügen">
          +
        </button>
      </div>

      {friends.length === 0 ? (
        <p className={styles.empty}>Noch keine Freunde. Füge Freunde hinzu!</p>
      ) : (
        <ul className={styles.list}>
          {friends.map((friend) => (
            <li key={friend.id} className={styles.row}>
              <span
                className={`${styles.statusDot} ${friend.isOnline ? styles.online : styles.offline}`}
                aria-label={friend.isOnline ? 'Online' : 'Offline'}
              />
              <div className={styles.avatar}>
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.username} />
                ) : (
                  (friend.username || '?')[0].toUpperCase()
                )}
              </div>
              <div className={styles.info}>
                <div className={styles.username}>{friend.username}</div>
                <div className={styles.elo}>ELO {friend.elo ?? '—'}</div>
              </div>
              <div className={styles.actions}>
                {friend.isOnline && (
                  <button
                    className={styles.challengeBtn}
                    onClick={() => onChallenge?.(friend)}
                    aria-label={`${friend.username} herausfordern`}
                  >
                    ⚔
                  </button>
                )}
                <button
                  className={styles.removeBtn}
                  onClick={() => onRemove?.(friend)}
                  aria-label={`${friend.username} entfernen`}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
