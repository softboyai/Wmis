import { forwardRef, useState } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import Input from './Input.jsx';

export function PasswordStrengthMeter({ password = '' }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Lowercase', pass: /[a-z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
    { label: 'Special character', pass: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const strengthLabel = ['', 'Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][score];
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-500'][score];

  if (!password) return null;

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex gap-1" aria-label={`Password strength: ${strengthLabel}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= score ? strengthColor : 'bg-gray-200 dark:bg-surface-3'}`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-500">Strength: {strengthLabel}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.pass ? 'text-green-500' : 'text-gray-400 dark:text-gray-600'}`}>
            {c.pass ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

const PasswordInput = forwardRef(function PasswordInput({ showMeter = false, label, error, required, id, ...props }, ref) {
  const [show, setShow] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          ref={ref}
          type={show ? 'text' : 'password'}
          className={`input pr-9 ${error ? 'input-error' : ''}`}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
          aria-required={required}
          {...props}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>}
      {showMeter && <PasswordStrengthMeter password={props.value || ''} />}
    </div>
  );
});

export default PasswordInput;
