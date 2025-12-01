/**
 * PINEntry Component
 *
 * PIN verification for entering edit mode.
 */

import { useState, useCallback } from 'react';
import { isValidPin } from '../../types/pin';
import './PIN.css';

interface PINEntryProps {
  onSubmit: (pin: string) => void;
  onCancel: () => void;
  error?: string | null;
}

export function PINEntry({ onSubmit, onCancel, error }: PINEntryProps) {
  const [pin, setPin] = useState('');

  const handlePinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  }, []);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (isValidPin(pin)) {
        onSubmit(pin);
      }
    },
    [pin, onSubmit]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="pin-container">
      <div className="pin-dialog">
        <h1 className="pin-title">Enter PIN</h1>
        <p className="pin-description">Enter your 4-digit PIN to edit the board.</p>

        <div className="pin-input-container">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={handlePinChange}
            onKeyDown={handleKeyDown}
            className="pin-input"
            aria-label="Enter PIN"
            autoFocus
          />

          <div className="pin-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`pin-dot ${i < pin.length ? 'pin-dot--filled' : ''}`}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="pin-error" role="alert">
            {error}
          </p>
        )}

        <div className="pin-buttons">
          <button type="button" className="pin-button pin-button--secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="pin-button pin-button--primary"
            onClick={() => handleSubmit()}
            disabled={!isValidPin(pin)}
          >
            Enter
          </button>
        </div>
      </div>
    </div>
  );
}
