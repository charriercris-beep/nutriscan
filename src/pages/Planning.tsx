import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { aujourdhui, joursDeLaSemaine, libelleJour, ajouterJours } from '../lib/date'
import { agregerParJour } from '../lib/planning'

export default function Planning() {
  const [dateRef, setDateRef] = useState(aujourdhui())
  const profil = useLiveQuery(() => db.profil.get(1), [])
  const jours = useMemo(() => joursDeLaSemaine(dateRef), [dateRef])
  const repas = useLiveQuery(() => db.repas.where('date').anyOf(jours).toArray(), [jours]) ?? []
  const totaux = useMemo(() => agregerParJour(repas, jours), [repas, jours])
  const objectifKcal = profil?.objectifKcal ?? 2000

  const debut = jours[0]
  const fin = jours[6]

  return (
    <div className="p-4 space-y-4 pb-8">
      <h1 className="text-2xl font-bold text-anthracite-800 dark:text-creme-50">Planning</h1>

      <div className="flex items-center justify-between bg-white dark:bg-anthracite-800 rounded-xl p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setDateRef(ajouterJours(dateRef, -7))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-lg"
          aria-label="Semaine précédente"
        >
          ‹
        </button>
        <span className="text-sm font-medium text-anthracite-700 dark:text-creme-100">
          {libelleJour(debut)} — {libelleJour(fin)}
        </span>
        <button
          type="button"
          onClick={() => setDateRef(ajouterJours(dateRef, 7))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-lg"
          aria-label="Semaine suivante"
        >
          ›
        </button>
      </div>

      <div className="space-y-2">
        {totaux.map((t) => {
          const dansObjectif = t.calories > 0 && t.calories <= objectifKcal
          return (
            <div
              key={t.date}
              className={`flex items-center justify-between rounded-xl p-3 shadow-sm ${
                dansObjectif
                  ? 'bg-sauge-50 dark:bg-sauge-700/20 border border-sauge-300 dark:border-sauge-700'
                  : 'bg-white dark:bg-anthracite-800'
              }`}
            >
              <span className="font-medium text-anthracite-800 dark:text-creme-50">{libelleJour(t.date)}</span>
              <span
                className={`font-semibold ${
                  t.calories === 0
                    ? 'text-anthracite-700/40 dark:text-creme-100/40'
                    : dansObjectif
                      ? 'text-sauge-700 dark:text-sauge-300'
                      : 'text-accent-600 dark:text-accent-500'
                }`}
              >
                {t.calories > 0 ? `${Math.round(t.calories)} kcal` : '—'}
              </span>
            </div>
          )
        })}
      </div>

      {totaux.every((t) => t.calories === 0) && (
        <div className="text-center py-8 text-anthracite-700/60 dark:text-creme-100/60">
          <div className="text-3xl mb-2">📅</div>
          <p className="text-sm">Aucun repas enregistré cette semaine.</p>
        </div>
      )}
    </div>
  )
}
