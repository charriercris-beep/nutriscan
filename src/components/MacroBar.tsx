interface Props {
  label: string
  valeur: number
  cible: number
  unite?: string
  couleur?: string
}

export default function MacroBar({ label, valeur, cible, unite = 'g', couleur = '#87a878' }: Props) {
  const pct = cible > 0 ? Math.min(100, (valeur / cible) * 100) : 0
  const depasse = cible > 0 && valeur > cible

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-anthracite-700 dark:text-creme-100">{label}</span>
        <span className="text-anthracite-700/70 dark:text-creme-100/70">
          {Math.round(valeur)} / {Math.round(cible)} {unite}
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-sauge-100 dark:bg-anthracite-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: depasse ? '#e08e45' : couleur }}
        />
      </div>
    </div>
  )
}
