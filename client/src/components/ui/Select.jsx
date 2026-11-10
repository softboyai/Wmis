import { forwardRef } from 'react';

const Select = forwardRef(function Select({
  label, error, required, children, className = '', id, placeholder, ...props
}, ref) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const errorId = `${selectId}-error`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="label">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-danger" role="alert">{error}</p>
      )}
    </div>
  );
});

export default Select;
