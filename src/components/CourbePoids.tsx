import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import type { Pesee } from '../types'
import { moyenneGlissante7j } from '../lib/calculs'
import { libelleJour } from '../lib/date'

interface Props {
  pesees: Pesee[]
  objectifKg?: number
}

export default function CourbePoids({ pesees, objectifKg }: Props) {
  if (pesees.length === 0) {
    return (
      <div className="text-center py-8 text-anthracite-700/60 dark:text-creme-100/60 text-sm">
        Ajoute des pesées pour voir ta courbe d'évolution.
      </div>
    )
  }

  const moyennes = moyenneGlissante7j(pesees)
  const donnees = moyennes.map((m) => {
    const pesee = pesees.find((p) => p.date === m.date)
    return { date: libelleJour(m.date), poids: pesee?.poidsKg, moyenne: m.moyenne }
  })

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={donnees} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip />
          {objectifKg && <ReferenceLine y={objectifKg} stroke="#e08e45" strokeDasharray="4 4" label={{ value: 'Objectif', fontSize: 10, fill: '#e08e45' }} />}
          <Line type="monotone" dataKey="poids" stroke="#b7cbab" strokeWidth={1.5} dot={{ r: 2 }} />
          <Line type="monotone" dataKey="moyenne" stroke="#57704c" strokeWidth={2.5} dot={false} name="Moyenne 7j" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
