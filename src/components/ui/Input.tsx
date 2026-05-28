import clsx from 'clsx'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'

interface FieldProps {
  hint?: string;
  label: string;
  required?: boolean;
}

export function Field({
  children,
  hint,
  label,
  required,
}: FieldProps & { children: ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
        {required ? <span className="ml-1" style={{ color: 'var(--color-danger)' }}>*</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{hint}</span> : null}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx('field-base', props.className)} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={clsx('field-base', props.className)} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={clsx('field-base min-h-28 resize-y', props.className)} {...props} />
}
