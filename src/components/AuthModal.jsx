import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from './Button.jsx';
import { OrnamentIcon } from './Ornament.jsx';
import styles from './AuthModal.module.css';

const AVATARS = [
  { id: 'quill', label: 'Feder' },
  { id: 'book', label: 'Buch' },
  { id: 'inkwell', label: 'Tintenfass' },
  { id: 'laurel', label: 'Lorbeer' },
  { id: 'scroll', label: 'Schriftrolle' },
  { id: 'mask', label: 'Maske' },
];

const AVATAR_ICON_MAP = {
  quill: 'feder',
  book: 'buch',
  inkwell: 'tintenfass',
  laurel: 'lorbeer',
  scroll: 'buchOffen',
  mask: 'stern',
};

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

export function AuthModal({ onClose, forceOpen = false }) {
  const { user, profile, isAuthenticated, isLoading, signIn, signOut, updateProfile } = useAuth();
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('quill');
  const [usernameError, setUsernameError] = useState('');
  const [saving, setSaving] = useState(false);

  const needsSetup = isAuthenticated && profile && !profile.username;

  // Auto-close modal when user signs in with a complete profile
  // This ensures auth-dependent pages refresh by triggering parent re-render via onClose
  useEffect(() => {
    if (isAuthenticated && profile && profile.username) {
      onClose();
    }
  }, [isAuthenticated, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUsernameChange = (val) => {
    setUsername(val);
    if (val && !USERNAME_RE.test(val)) {
      setUsernameError('3–20 Zeichen, nur Buchstaben, Zahlen und Unterstrich');
    } else {
      setUsernameError('');
    }
  };

  const handleSaveProfile = async () => {
    if (!USERNAME_RE.test(username)) {
      setUsernameError('3–20 Zeichen, nur Buchstaben, Zahlen und Unterstrich');
      return;
    }
    setSaving(true);
    const result = await updateProfile({ username, avatar_url: selectedAvatar });
    setSaving(false);
    if (result) {
      onClose();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={forceOpen ? undefined : onClose}>
      <div onClick={e => e.stopPropagation()} className={styles.modal}>
        {!forceOpen && <button className={styles.closeX} onClick={onClose} aria-label="Schließen">&times;</button>}
        {/* Loading state */}
        {isLoading && (
          <div className={styles.loadingWrap}>
            <OrnamentIcon name="tintenfass" size="lg" />
            <p className={styles.loadingText}>Laden...</p>
          </div>
        )}

        {/* Not authenticated — sign in prompt */}
        {!isLoading && !isAuthenticated && (
          <>
            <h2 className={styles.title}>Willkommen bei Eloquent</h2>
            <p className={styles.subtitle}>
              Melde dich an, um deinen Fortschritt zu speichern, Online-Duelle zu spielen
              und auf der globalen Rangliste aufzusteigen.
            </p>

            <div className={styles.benefitsList}>
              <div className={styles.benefit}>
                <OrnamentIcon name="federn" size="sm" />
                <span>Fortschritt geräteübergreifend speichern</span>
              </div>
              <div className={styles.benefit}>
                <OrnamentIcon name="lorbeer" size="sm" />
                <span>Online gegen andere antreten</span>
              </div>
              <div className={styles.benefit}>
                <OrnamentIcon name="stern" size="sm" />
                <span>Globale Rangliste und Elo-Rating</span>
              </div>
            </div>

            <div className={styles.divider} />

            <Button variant="gold" onClick={signIn} style={{ width: '100%', justifyContent: 'center' }}>
              <OrnamentIcon name="stern" size="sm" />
              Mit Google anmelden
            </Button>

            <button onClick={onClose} className={styles.closeBtn}>Abbrechen</button>
          </>
        )}

        {/* Authenticated but needs username setup */}
        {!isLoading && needsSetup && (
          <>
            <h2 className={styles.title}>Willkommen bei Eloquent</h2>
            <p className={styles.subtitle}>
              Wähle einen Benutzernamen und Avatar für dein Profil.
            </p>

            <div className={styles.section}>
              <label className={styles.inputLabel}>Benutzername</label>
              <input
                type="text"
                value={username}
                onChange={e => handleUsernameChange(e.target.value)}
                placeholder="DeinName_42"
                className={styles.input}
                maxLength={20}
              />
              {usernameError && <div className={styles.errorMsg}>{usernameError}</div>}
            </div>

            <div className={styles.section}>
              <label className={styles.inputLabel}>Avatar</label>
              <div className={styles.avatarGrid}>
                {AVATARS.map(av => (
                  <div
                    key={av.id}
                    onClick={() => setSelectedAvatar(av.id)}
                    className={selectedAvatar === av.id ? styles.avatarSelected : styles.avatarOption}
                  >
                    <OrnamentIcon name={AVATAR_ICON_MAP[av.id]} size="lg" />
                    <span className={styles.avatarLabel}>{av.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="gold"
              onClick={handleSaveProfile}
              disabled={!username || !!usernameError || saving}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {saving ? 'Speichern...' : 'Profil erstellen'}
            </Button>
          </>
        )}

        {/* Authenticated with profile — show summary */}
        {!isLoading && isAuthenticated && profile && profile.username && (
          <>
            <h2 className={styles.title}>Dein Profil</h2>

            <div className={styles.profileSummary}>
              <div className={styles.profileAvatar}>
                <OrnamentIcon name={AVATAR_ICON_MAP[profile.avatar_url] || 'feder'} size="xl" />
              </div>
              <div className={styles.profileInfo}>
                <div className={styles.profileName}>{profile.username}</div>
                <div className={styles.profileEmail}>{user?.email}</div>
              </div>
            </div>

            <div className={styles.profileStats}>
              <div className={styles.profileStat}>
                <span className={styles.profileStatValue}>{profile.elo_rating || 1200}</span>
                <span className={styles.profileStatLabel}>Elo</span>
              </div>
              <div className={styles.profileStat}>
                <span className={styles.profileStatValue}>{profile.wins || 0}</span>
                <span className={styles.profileStatLabel}>Siege</span>
              </div>
              <div className={styles.profileStat}>
                <span className={styles.profileStatValue}>{profile.total_games || 0}</span>
                <span className={styles.profileStatLabel}>Spiele</span>
              </div>
            </div>

            <Button variant="danger" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
              Abmelden
            </Button>

            <button onClick={onClose} className={styles.closeBtn}>Schließen</button>
          </>
        )}
      </div>
    </div>
  );
}
