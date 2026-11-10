import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea({
  label, error, required, helpText, className = '', id, rows = 3, ...props
}, ref) {
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
      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`input resize-none ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      />
      {helpText && !error && <p className="text-xs text-gray-500">{helpText}</p>}
      {error && <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>}
    </div>
  );
});

export default Textarea;
