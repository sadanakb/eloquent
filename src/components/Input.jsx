// src/components/Input.jsx
import styles from './Input.module.css';

export function Input({ label, placeholder, value, onChange, type = 'text', disabled = false, className = '' }) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && <label className={styles.label}>{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${styles.input} ${disabled ? styles.disabled : ''}`}
      />
    </div>
  );
}
