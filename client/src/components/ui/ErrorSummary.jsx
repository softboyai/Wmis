import { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

export default function ErrorSummary({ errors, title = 'Please fix the following errors:' }) {
  const ref = useRef(null);
  const errorList = Object.entries(errors).filter(([, v]) => v?.message);

  useEffect(() => {
    if (errorList.length > 0 && ref.current) {
      ref.current.focus();
    }
  }, [errorList.length]);

  if (errorList.length === 0) return null;

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alert"
      aria-live="assertive"
      className="rounded border border-danger/30 bg-danger/5 p-3 space-y-1.5 focus:outline-none"
    >
      <div className="flex items-center gap-2 text-danger text-xs font-medium">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" aria-hidden />
        {title}
      </div>
      <ul className="list-disc list-inside space-y-0.5">
        {errorList.map(([field, err]) => (
          <li key={field} className="text-xs text-danger">
            <a href={`#${field}`} className="underline hover:no-underline">{err.message}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
