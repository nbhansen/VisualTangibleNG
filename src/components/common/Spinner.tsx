/**
 * Spinner Component
 *
 * Loading spinner for async operations.
 */

import './common.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  label?: string;
}

export function Spinner({ size = 'medium', label = 'Loading' }: SpinnerProps) {
  return (
    <div className={`spinner spinner--${size}`} role="status" aria-label={label}>
      <div className="spinner__circle" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
