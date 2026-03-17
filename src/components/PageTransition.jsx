import { useState, useEffect, useRef } from 'react';

/**
 * PageTransition — crossfade wrapper for page changes.
 * When `pageKey` changes, fades out the old content and fades in the new.
 */
export function PageTransition({ pageKey, children }) {
  const [phase, setPhase] = useState('enter'); // 'enter' | 'exit'
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevKeyRef = useRef(pageKey);

  useEffect(() => {
    if (prevKeyRef.current !== pageKey) {
      // Key changed — start exit transition
      setPhase('exit');

      const exitTimer = setTimeout(() => {
        // After exit completes, swap content and enter
        setDisplayChildren(children);
        setPhase('enter');
        prevKeyRef.current = pageKey;
      }, 300);

      return () => clearTimeout(exitTimer);
    } else {
      // Same key — just update children in place
      setDisplayChildren(children);
    }
  }, [pageKey, children]);

  const style = {
    position: 'relative',
    opacity: phase === 'exit' ? 0 : 1,
    transition: 'opacity 300ms ease-in-out',
  };

  return (
    <div
      className={`page-transition page-${phase}`}
      style={style}
    >
      {displayChildren}
    </div>
  );
}
