import { useState, useEffect, useRef } from 'react';

/**
 * useTypewriter — character-by-character text reveal.
 * @param {string} text   The full text to reveal.
 * @param {number} speed  Milliseconds per character (default 40).
 * @returns {{ displayText: string, isComplete: boolean }}
 */
export function useTypewriter(text, speed = 40) {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const indexRef = useRef(0);

  useEffect(() => {
    // Reset on text change
    setDisplayText('');
    setIsComplete(false);
    indexRef.current = 0;

    if (!text) {
      setIsComplete(true);
      return;
    }

    const interval = setInterval(() => {
      indexRef.current += 1;
      const next = text.slice(0, indexRef.current);
      setDisplayText(next);

      if (indexRef.current >= text.length) {
        setIsComplete(true);
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayText, isComplete };
}
