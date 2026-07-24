import type { TypeRepas } from '../types'
import { ICONE_TYPE_REPAS, LABEL_TYPE_REPAS, ORDRE_TYPE_REPAS } from '../lib/labels'

interface Props {
  type: TypeRepas
  onTypeChange: (t: TypeRepas) => void
  date: string
  onDateChange: (d: string) => void
}

export default function SelecteurRepasDate({ type, onTypeChange, date, onDateChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {ORDRE_TYPE_REPAS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTypeChange(t)}
            className={`min-h-[56px] rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 text-xs font-medium ${
              type === t
                ? 'border-sauge-500 bg-sauge-50 text-sauge-700 dark:bg-sauge-700/20 dark:text-sauge-300'
                : 'border-sauge-100 dark:border-anthracite-700 text-anthracite-700 dark:text-creme-100'
            }`}
          >
            <span className="text-lg" aria-hidden="true">{ICONE_TYPE_REPAS[t]}</span>
            {LABEL_TYPE_REPAS[t]}
          </button>
        ))}
      </div>
      <input
        type="date"
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="w-full min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
      />
    </div>
  )
}
