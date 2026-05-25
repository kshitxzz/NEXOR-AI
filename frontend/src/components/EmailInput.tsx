import { emailShowsGmailSuffix, normalizeEmailWithGmail } from '../utils/email';

interface EmailInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onNormalized?: (normalized: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function EmailInput({
  id,
  value,
  onChange,
  onNormalized,
  placeholder = 'Enter your email',
  required,
}: EmailInputProps) {
  const showSuffix = emailShowsGmailSuffix(value);

  const handleBlur = () => {
    const normalized = normalizeEmailWithGmail(value);
    if (normalized !== value) {
      onChange(normalized);
      onNormalized?.(normalized);
    }
  };

  return (
    <div className={`email-input-wrap${showSuffix ? ' has-suffix' : ''}`}>
      <input
        id={id}
        type="text"
        inputMode="email"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder={placeholder}
        required={required}
        autoComplete="email"
        className="email-input-field"
      />
      {showSuffix && (
        <span className="email-gmail-suffix" aria-hidden="true">
          @gmail.com
        </span>
      )}
    </div>
  );
}

export { normalizeEmailWithGmail };
