import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react';
import { cx } from './utils';

/* The Field wrapper owns the label/help/error wiring. Passing an `error`
   automatically sets aria-invalid and points aria-describedby at the message,
   so an error is never signalled by the red border alone. */

interface FieldOwnProps {
  label?: string;
  help?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface FieldShellProps extends FieldOwnProps {
  id: string;
  children: (a11y: { id: string; 'aria-describedby'?: string; 'aria-invalid'?: true }) => ReactNode;
}

function FieldShell({ id, label, help, error, required, className, children }: FieldShellProps) {
  const helpId = `${id}-help`;
  const errId = `${id}-err`;
  const describedBy = [help && helpId, error && errId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cx('jrk-field', className)}>
      {label && (
        <label className="jrk-field__label" htmlFor={id} data-required={required || undefined}>
          {label}
        </label>
      )}
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {help && !error && (
        <span className="jrk-field__help" id={helpId}>
          {help}
        </span>
      )}
      {error && (
        <span className="jrk-field__error" id={errId} role="alert">
          <svg viewBox="0 0 16 16" aria-hidden="true" strokeWidth="2" strokeLinecap="round">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M8 5v3.5M8 11h.01" />
          </svg>
          {error}
        </span>
      )}
    </div>
  );
}

/* ---------------------------------- Input ---------------------------------- */

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'>,
    FieldOwnProps {
  size?: 'sm' | 'md' | 'lg';
  /** Right-aligns on tabular figures — for money and counts. */
  numeric?: boolean;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, help, error, required, className, size = 'md', numeric, leadingIcon, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      help={help}
      error={error}
      required={required}
      className={className}
    >
      {(a11y) => {
        const input = (
          <input
            {...rest}
            {...a11y}
            ref={ref}
            required={required}
            className={cx(
              'jrk-input',
              size !== 'md' && `jrk-input--${size}`,
              numeric && 'jrk-input--numeric',
            )}
          />
        );
        return leadingIcon ? (
          <span className="jrk-input-group">
            <span className="jrk-input-group__icon">{leadingIcon}</span>
            {input}
          </span>
        ) : (
          input
        );
      }}
    </FieldShell>
  );
});

/* ---------------------------------- Select --------------------------------- */

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className'>,
    FieldOwnProps {
  size?: 'sm' | 'md' | 'lg';
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, help, error, required, className, size = 'md', id, children, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell id={fieldId} label={label} help={help} error={error} required={required} className={className}>
      {(a11y) => (
        <select
          {...rest}
          {...a11y}
          ref={ref}
          required={required}
          className={cx('jrk-select', size !== 'md' && `jrk-select--${size}`)}
        >
          {children}
        </select>
      )}
    </FieldShell>
  );
});

/* --------------------------------- Textarea -------------------------------- */

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'>,
    FieldOwnProps {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, help, error, required, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;

  return (
    <FieldShell id={fieldId} label={label} help={help} error={error} required={required} className={className}>
      {(a11y) => <textarea {...rest} {...a11y} ref={ref} required={required} className="jrk-textarea" />}
    </FieldShell>
  );
});

/* -------------------------------- Checkbox --------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: ReactNode;
  hint?: string;
  className?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <label className={cx('jrk-check', className)} htmlFor={fieldId}>
      <input {...rest} ref={ref} id={fieldId} type="checkbox" />
      <span className="jrk-check__label">
        {label}
        {hint && <span className="jrk-check__hint">{hint}</span>}
      </span>
    </label>
  );
});

/* --------------------------------- Switch ---------------------------------- */

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> {
  label: ReactNode;
  className?: string;
}

/** For settings that take effect immediately. If the change needs a Save
 *  press, use a Checkbox — a switch that does not apply at once misleads. */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { label, className, id, ...rest },
  ref,
) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <label className={cx('jrk-switch', className)} htmlFor={fieldId}>
      <input {...rest} ref={ref} id={fieldId} type="checkbox" role="switch" />
      <span className="jrk-check__label">{label}</span>
    </label>
  );
});
