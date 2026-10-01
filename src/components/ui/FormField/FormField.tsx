import { useId } from 'react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'tel'
  required?: boolean
  autoComplete?: string
  multiline?: boolean
  rows?: number
}

/** Input with a floating label. */
export default function FormField({ label, value, onChange, type = 'text', required, autoComplete, multiline, rows = 5 }: Props) {
  const id = useId()
  const base =
    'peer w-full rounded-xl border border-white/10 bg-night/60 px-4 pb-2.5 pt-6 text-sm text-ivory placeholder-transparent outline-none transition-colors focus:border-ember-light focus:bg-night/80'

  return (
    <div className="relative">
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          rows={rows}
          placeholder={label}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          autoComplete={autoComplete}
          placeholder={label}
          className={base}
        />
      )}
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mist transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-xs peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:top-2 peer-focus:text-[0.65rem] peer-focus:uppercase peer-focus:tracking-[0.2em] peer-focus:text-ember-light"
      >
        {label}
      </label>
    </div>
  )
}
