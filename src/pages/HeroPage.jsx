import { Button } from '../components/Button.jsx';
import { Logo } from '../components/Logo.jsx';
import { OrnamentIcon, OrnamentDivider } from '../components/Ornament.jsx';
import styles from './HeroPage.module.css';

export function HeroPage({ onNavigate }) {
  return (
    <div className={`${styles.wrapper} texture-paper`}>
      <div className={`${styles.content} animate-slide`}>
        <Logo />

        <OrnamentDivider symbol="\u2726" />

        <p className={styles.tagline}>
          Die Kunst der Sprache als Wettkampf.
          <br />
          <span className={styles.subTagline}>Tritt an. Formuliere. Überzeuge.</span>
        </p>

        <div className={styles.actions}>
          <Button variant="gold" onClick={() => onNavigate('duell')} style={{ fontSize: 17, padding: '16px 40px' }}>
            <OrnamentIcon name="federn" size="sm" /> Duell starten
          </Button>
          <Button variant="default" onClick={() => onNavigate('uebung')} style={{ fontSize: 17, padding: '16px 40px' }}>
            <OrnamentIcon name="ziel" size="sm" /> Übungsmodus
          </Button>
        </div>

        <div className={styles.navLinks}>
          {[
            { icon: 'buch', label: 'Wörterbücherei', page: 'woerterbuch' },
            { icon: 'lorbeer', label: 'Rangliste', page: 'rangliste' },
            { icon: 'buchOffen', label: 'Story-Modus', page: 'story' },
            { icon: 'feder', label: 'Regeln', page: 'regeln' },
          ].map(item => (
            <div key={item.page} onClick={() => onNavigate(item.page)} className={styles.navItem}>
              <div className={styles.navIcon}>
                <OrnamentIcon name={item.icon} size="lg" />
              </div>
              <div className={styles.navLabel}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
