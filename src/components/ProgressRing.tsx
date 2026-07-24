interface Props {
  pourcentage: number // 0-100+
  taille?: number
  epaisseur?: number
  couleur?: string
  fond?: string
  enfants?: React.ReactNode
}

export default function ProgressRing({
  pourcentage,
  taille = 200,
  epaisseur = 14,
  couleur = '#87a878',
  fond = '#e3ebde',
  enfants,
}: Props) {
  const rayon = (taille - epaisseur) / 2
  const circonference = 2 * Math.PI * rayon
  const pct = Math.max(0, Math.min(100, pourcentage))
  const offset = circonference - (pct / 100) * circonference
  const depassement = pourcentage > 100

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: taille, height: taille }}>
      <svg width={taille} height={taille} className="-rotate-90">
        <circle cx={taille / 2} cy={taille / 2} r={rayon} stroke={fond} strokeWidth={epaisseur} fill="none" />
        <circle
          cx={taille / 2}
          cy={taille / 2}
          r={rayon}
          stroke={depassement ? '#e08e45' : couleur}
          strokeWidth={epaisseur}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circonference}
          strokeDashoffset={offset}
          className="animate-ring-grow"
          style={{ ['--ring-start' as string]: circonference, ['--ring-end' as string]: offset }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{enfants}</div>
    </div>
  )
}
