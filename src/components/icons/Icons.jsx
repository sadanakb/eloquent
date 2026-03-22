// src/components/icons/Icons.jsx

const iconProps = (size, color) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: color,
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
});

export function CrossedFeathers({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M3 21 L10 14 M14 10 L21 3 M8 3 C8 3 12 3 15 6 C18 9 17 13 14 14 L10 14 M16 21 C16 21 16 17 13 14" />
    </svg>
  );
}

export function GlobeNetwork({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3 C9 7 9 17 12 21 M12 3 C15 7 15 17 12 21 M3 12 L21 12" />
      <circle cx="5" cy="7" r="1.5" fill={color} stroke="none" />
      <circle cx="19" cy="7" r="1.5" fill={color} stroke="none" />
      <circle cx="12" cy="20" r="1.5" fill={color} stroke="none" />
    </svg>
  );
}

export function Bullseye({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

export function OpenBook({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M2 6 C2 6 7 5 12 8 C17 5 22 6 22 6 L22 19 C22 19 17 18 12 21 C7 18 2 19 2 19 Z" />
      <path d="M12 8 L12 21" />
    </svg>
  );
}

export function StarIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <polygon points="12,2 15.1,8.3 22,9.3 17,14.1 18.2,21 12,17.8 5.8,21 7,14.1 2,9.3 8.9,8.3" />
    </svg>
  );
}

export function BoltIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M13 2 L4 14 L11 14 L11 22 L20 10 L13 10 Z" />
    </svg>
  );
}

export function ScrollIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M6 4 C6 4 4 4 4 6 C4 8 6 8 6 8 L18 8 C18 8 20 8 20 10 C20 12 18 12 18 12 L6 12 C6 12 4 12 4 14 C4 16 6 16 6 16 L18 16" />
      <path d="M8 4 L18 4 C18 4 20 4 20 6 L20 14" />
    </svg>
  );
}

export function ShieldIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M12 2 L20 6 L20 12 C20 16.4 16.5 20.2 12 22 C7.5 20.2 4 16.4 4 12 L4 6 Z" />
    </svg>
  );
}

export function TrophyIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M8 21 L16 21 M12 17 L12 21 M5 3 L19 3 L19 10 C19 13.9 15.9 17 12 17 C8.1 17 5 13.9 5 10 Z" />
      <path d="M5 5 L2 5 L2 8 C2 10.2 3.8 12 6 12" />
      <path d="M19 5 L22 5 L22 8 C22 10.2 20.2 12 18 12" />
    </svg>
  );
}

export function BookmarkBook({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M4 4 C4 3 5 2 6 2 L18 2 C19 2 20 3 20 4 L20 22 L14 18 L8 22 L4 22 Z" />
      <path d="M8 2 L8 14 L11 12 L14 14 L14 2" />
    </svg>
  );
}

export function SwordIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M14.5 17.5 L3 6 L3 3 L6 3 L17.5 14.5" />
      <path d="M13 19 L19 13" />
      <path d="M16 16 L21 21" />
      <path d="M14.5 17.5 L18 21 L21 18 L17.5 14.5" />
    </svg>
  );
}

export function CrownIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M2 19 L22 19 L19 9 L14 14 L12 7 L10 14 L5 9 Z" />
    </svg>
  );
}

export function FeatherIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}

export function SearchIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21 L16.65 16.65" />
    </svg>
  );
}

export function LockIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11 L7 7 C7 4.8 9.2 3 12 3 C14.8 3 17 4.8 17 7 L17 11" />
    </svg>
  );
}

export function SunIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export function MoonIcon({ size = 24, color = 'currentColor' }) {
  return (
    <svg {...iconProps(size, color)}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
