import { forwardRef } from 'react';

const Input = forwardRef(function Input({
  label, error, required, helpText, className = '', id, ...props
}, ref) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${inputId}-error`;
  const helpId = `${inputId}-help`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="label">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={[error && errorId, helpText && helpId].filter(Boolean).join(' ') || undefined}
        aria-required={required}
        {...props}
      />
      {helpText && !error && (
        <p id={helpId} className="text-xs text-gray-500 dark:text-gray-500">{helpText}</p>
      )}
      {error && (
        <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
});

export default Input;
