import { useMemo } from 'react';
import styles from './GoldParticles.module.css';

const CHARS = ['✦', '❖', '◆', '★', '●', '◈'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * GoldParticles — floating golden letters/symbols animation.
 * Renders 8-12 particles that drift upward and fade.
 */
export function GoldParticles({ active }) {
  const particles = useMemo(() => {
    const count = Math.floor(randomBetween(8, 13));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      char: CHARS[Math.floor(Math.random() * CHARS.length)],
      left: `${randomBetween(0, 100).toFixed(1)}%`,
      delay: `${randomBetween(0, 2).toFixed(2)}s`,
      duration: `${randomBetween(2, 4).toFixed(2)}s`,
      fontSize: `${randomBetween(12, 20).toFixed(0)}px`,
    }));
  }, [active]);

  if (!active) return null;

  return (
    <div className={styles.container}>
      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.particle}
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            fontSize: p.fontSize,
          }}
        >
          {p.char}
        </span>
      ))}
    </div>
  );
}
