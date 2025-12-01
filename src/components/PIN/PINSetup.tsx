/**
 * PINSetup Component
 *
 * First-time PIN creation for edit mode protection.
 */

import { useState, useCallback } from 'react';
import { isValidPin, PIN_REQUIREMENTS } from '../../types/pin';
import './PIN.css';

interface PINSetupProps {
  onComplete: (pin: string) => void;
  onCancel: () => void;
}

export function PINSetup({ onComplete, onCancel }: PINSetupProps) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState<string | null>(null);

  const handlePinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 4);

      if (step === 'enter') {
        setPin(value);
        setError(null);
      } else {
        setConfirmPin(value);
        setError(null);
      }
    },
    [step]
  );

  const handleContinue = useCallback(() => {
    if (step === 'enter') {
      if (!isValidPin(pin)) {
        setError(`PIN must be ${PIN_REQUIREMENTS.length} digits`);
        return;
      }
      setStep('confirm');
    } else {
      if (confirmPin !== pin) {
        setError('PINs do not match');
        setConfirmPin('');
        return;
      }
      onComplete(pin);
    }
  }, [step, pin, confirmPin, onComplete]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleContinue();
      }
    },
    [handleContinue]
  );

  const currentValue = step === 'enter' ? pin : confirmPin;
  const isValid = isValidPin(currentValue);

  return (
    <div className="pin-container">
      <div className="pin-dialog">
        <h1 className="pin-title">
          {step === 'enter' ? 'Create Edit PIN' : 'Confirm PIN'}
        </h1>
        <p className="pin-description">
          {step === 'enter'
            ? 'Enter a 4-digit PIN to protect edit mode.'
            : 'Enter your PIN again to confirm.'}
        </p>

        <div className="pin-input-container">
          <input
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={currentValue}
            onChange={handlePinChange}
            onKeyDown={handleKeyDown}
            className="pin-input"
            aria-label={step === 'enter' ? 'Enter PIN' : 'Confirm PIN'}
            autoFocus
          />

          <div className="pin-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`pin-dot ${i < currentValue.length ? 'pin-dot--filled' : ''}`}
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
            onClick={handleContinue}
            disabled={!isValid}
          >
            {step === 'enter' ? 'Continue' : 'Set PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
