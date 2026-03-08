import * as React from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { parseEmailInput } from './MultiEmailInput.helpers';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface MultiEmailInputProps {
  value: string[];
  onChange: (emails: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiEmailInput({
  value,
  onChange,
  placeholder = 'Add email...',
  disabled = false,
}: MultiEmailInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const addEmails = React.useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const { valid, invalid } = parseEmailInput(trimmed);

      if (invalid.length > 0) {
        setError(`Invalid: ${invalid.join(', ')}`);
      } else {
        setError(null);
      }

      if (valid.length > 0) {
        const unique = Array.from(new Set([...value, ...valid]));
        onChange(unique);
      }

      setInputValue('');
    },
    [value, onChange],
  );

  const removeEmail = React.useCallback(
    (email: string) => {
      onChange(value.filter((e) => e !== email));
    },
    [value, onChange],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
        if (inputValue.trim()) {
          e.preventDefault();
          addEmails(inputValue);
        }
      } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
        removeEmail(value[value.length - 1]);
      }
    },
    [inputValue, value, addEmails, removeEmail],
  );

  const handlePaste = React.useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const pasted = e.clipboardData.getData('text');
      if (pasted.includes(',') || pasted.includes(';') || pasted.includes(' ')) {
        e.preventDefault();
        addEmails(pasted);
      }
    },
    [addEmails],
  );

  const handleBlur = React.useCallback(() => {
    if (inputValue.trim()) {
      addEmails(inputValue);
    }
  }, [inputValue, addEmails]);

  return (
    <div>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- keyboard input is handled by the inner <Input> */}
      <div
        className="flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 min-h-[2.5rem] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((email) => (
          <Badge
            key={email}
            variant="secondary"
            className="flex items-center gap-1 text-xs"
          >
            {email}
            {!disabled && (
              <button
                type="button"
                aria-label={`Remove ${email}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Badge>
        ))}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[120px] border-0 shadow-none p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
