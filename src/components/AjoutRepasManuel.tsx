import { useState } from 'react'
import { db } from '../db/schema'
import type { Confiance, TypeRepas } from '../types'
import { aujourdhui, repasPreselectionne } from '../lib/date'

const TYPES: { valeur: TypeRepas; label: string }[] = [
  { valeur: 'petit_dejeuner', label: 'Petit-déj' },
  { valeur: 'dejeuner', label: 'Déjeuner' },
  { valeur: 'diner', label: 'Dîner' },
  { valeur: 'collation', label: 'Collation' },
]

export default function AjoutRepasManuel({ onFerme }: { onFerme: () => void }) {
  const [nom, setNom] = useState('')
  const [type, setType] = useState<TypeRepas>(repasPreselectionne())
  const [date, setDate] = useState(aujourdhui())
  const [calories, setCalories] = useState('')
  const [proteinesG, setProteinesG] = useState('')
  const [lipidesG, setLipidesG] = useState('')
  const [glucidesG, setGlucidesG] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function ajouter() {
    if (!nom.trim() || !calories) return
    setEnCours(true)
    await db.repas.add({
      date,
      type,
      nom: nom.trim(),
      portionG: 0,
      calories: parseFloat(calories) || 0,
      proteinesG: parseFloat(proteinesG) || 0,
      lipidesG: parseFloat(lipidesG) || 0,
      lipidesSaturesG: 0,
      glucidesG: parseFloat(glucidesG) || 0,
      sucresG: 0,
      fibresG: 0,
      selG: 0,
      confiance: 'moyenne' as Confiance,
      modifieManuellement: true,
      creeLe: Date.now(),
    })
    setEnCours(false)
    onFerme()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onFerme}>
      <div
        className="w-full max-w-[480px] bg-white dark:bg-anthracite-800 rounded-t-3xl p-4 space-y-3 animate-pop-in max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-sauge-100 dark:bg-anthracite-700 rounded-full mx-auto" />
        <h2 className="text-lg font-bold text-anthracite-800 dark:text-creme-50">Ajouter un repas</h2>

        <input
          type="text"
          placeholder="Nom du plat"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
        />

        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.valeur}
              type="button"
              onClick={() => setType(t.valeur)}
              className={`min-h-[44px] rounded-xl border-2 font-medium ${
                type === t.valeur
                  ? 'border-sauge-500 bg-sauge-50 text-sauge-700 dark:bg-sauge-700/20 dark:text-sauge-300'
                  : 'border-sauge-100 dark:border-anthracite-700 text-anthracite-700 dark:text-creme-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            placeholder="Calories (kcal)"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            className="min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
          />
          <input
            type="number"
            placeholder="Protéines (g)"
            value={proteinesG}
            onChange={(e) => setProteinesG(e.target.value)}
            className="min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
          />
          <input
            type="number"
            placeholder="Lipides (g)"
            value={lipidesG}
            onChange={(e) => setLipidesG(e.target.value)}
            className="min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
          />
          <input
            type="number"
            placeholder="Glucides (g)"
            value={glucidesG}
            onChange={(e) => setGlucidesG(e.target.value)}
            className="min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-3"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onFerme}
            className="flex-1 min-h-[48px] rounded-xl border-2 border-sauge-100 dark:border-anthracite-700 font-semibold text-anthracite-700 dark:text-creme-100"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={enCours || !nom.trim() || !calories}
            onClick={ajouter}
            className="flex-1 min-h-[48px] rounded-xl bg-sauge-600 text-white font-semibold disabled:opacity-50"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  )
}
