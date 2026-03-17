import { useState, useEffect, useMemo } from 'react';
import styles from './Confetti.module.css';

const COLORS = ['#8B6914', '#C4956A', '#A67C52', '#4A6741', '#2C1810'];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Confetti — CSS-only celebration animation.
 * Renders 25 falling, rotating confetti pieces.
 * Auto-dismisses after 3 seconds.
 */
export function Confetti({ active }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      setVisible(true);
      const timer = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(timer);
    }
    setVisible(false);
  }, [active]);

  const pieces = useMemo(() => {
    return Array.from({ length: 25 }, (_, i) => {
      const size = randomBetween(6, 12);
      return {
        id: i,
        left: `${randomBetween(0, 100).toFixed(1)}%`,
        width: `${size.toFixed(0)}px`,
        height: `${size.toFixed(0)}px`,
        backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: `${randomBetween(0, 360).toFixed(0)}deg`,
        duration: `${randomBetween(2, 4).toFixed(2)}s`,
        delay: `${randomBetween(0, 2).toFixed(2)}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      };
    });
  }, [active]);

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className={styles.piece}
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            backgroundColor: p.backgroundColor,
            transform: `rotate(${p.rotation})`,
            animationDuration: p.duration,
            animationDelay: p.delay,
            borderRadius: p.borderRadius,
          }}
        />
      ))}
    </div>
  );
}
