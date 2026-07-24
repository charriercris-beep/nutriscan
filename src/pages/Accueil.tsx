import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db } from '../db/schema'
import { aujourdhui } from '../lib/date'
import { ICONE_TYPE_REPAS, LABEL_TYPE_REPAS, ORDRE_TYPE_REPAS } from '../lib/labels'
import ProgressRing from '../components/ProgressRing'
import MacroBar from '../components/MacroBar'
import AjoutRepasManuel from '../components/AjoutRepasManuel'

export default function Accueil() {
  const navigate = useNavigate()
  const date = aujourdhui()
  const profil = useLiveQuery(() => db.profil.get(1), [])
  const repasJour = useLiveQuery(() => db.repas.where('date').equals(date).toArray(), [date]) ?? []
  const [modalOuvert, setModalOuvert] = useState(false)

  const totaux = useMemo(
    () =>
      repasJour.reduce(
        (acc, r) => ({
          calories: acc.calories + r.calories,
          proteinesG: acc.proteinesG + r.proteinesG,
          lipidesG: acc.lipidesG + r.lipidesG,
          glucidesG: acc.glucidesG + r.glucidesG,
        }),
        { calories: 0, proteinesG: 0, lipidesG: 0, glucidesG: 0 },
      ),
    [repasJour],
  )

  const objectifKcal = profil?.objectifKcal ?? 2000
  const restant = Math.round(objectifKcal - totaux.calories)
  const pct = objectifKcal > 0 ? (totaux.calories / objectifKcal) * 100 : 0

  const groupes = ORDRE_TYPE_REPAS.map((type) => ({
    type,
    repas: repasJour.filter((r) => r.type === type),
  })).filter((g) => g.repas.length > 0)

  async function supprimer(id?: number) {
    if (id === undefined) return
    await db.repas.delete(id)
  }

  return (
    <div className="p-4 space-y-6 pb-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-anthracite-800 dark:text-creme-50">Aujourd'hui</h1>
          <p className="text-sm text-anthracite-700/60 dark:text-creme-100/60">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </header>

      {!profil && (
        <div className="bg-accent-500/10 border border-accent-500/40 rounded-xl p-3 text-sm text-accent-600 dark:text-accent-500">
          Configure ton profil pour voir tes objectifs personnalisés.{' '}
          <button className="underline font-medium" onClick={() => navigate('/profil')}>
            Aller au profil
          </button>
        </div>
      )}

      <section className="flex flex-col items-center py-2">
        <ProgressRing pourcentage={pct} taille={200} epaisseur={16}>
          <span className="text-4xl font-bold text-anthracite-800 dark:text-creme-50">{Math.round(totaux.calories)}</span>
          <span className="text-xs text-anthracite-700/60 dark:text-creme-100/60">/ {objectifKcal} kcal</span>
          <span className={`text-xs mt-1 font-medium ${restant >= 0 ? 'text-sauge-700 dark:text-sauge-300' : 'text-accent-600 dark:text-accent-500'}`}>
            {restant >= 0 ? `${restant} kcal restantes` : `${Math.abs(restant)} kcal au-delà`}
          </span>
        </ProgressRing>
      </section>

      <section className="space-y-3 bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm">
        <MacroBar label="Protéines" valeur={totaux.proteinesG} cible={profil?.cibleProteinesG ?? 0} couleur="#87a878" />
        <MacroBar label="Lipides" valeur={totaux.lipidesG} cible={profil?.cibleLipidesG ?? 0} couleur="#e08e45" />
        <MacroBar label="Glucides" valeur={totaux.glucidesG} cible={profil?.cibleGlucidesG ?? 0} couleur="#6d8c60" />
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => navigate('/scanner')}
          className="min-h-[64px] rounded-2xl bg-sauge-600 text-white font-semibold flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl" aria-hidden="true">📷</span>
          Scanner un plat
        </button>
        <button
          type="button"
          onClick={() => navigate('/comparateur')}
          className="min-h-[64px] rounded-2xl bg-accent-500 text-white font-semibold flex flex-col items-center justify-center gap-1 active:scale-[0.98] transition-transform"
        >
          <span className="text-2xl" aria-hidden="true">⚖️</span>
          Comparer deux menus
        </button>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Repas du jour</h2>
          <button
            type="button"
            onClick={() => setModalOuvert(true)}
            className="text-sm font-medium text-sauge-700 dark:text-sauge-300 underline"
          >
            + Ajouter manuellement
          </button>
        </div>

        {groupes.length === 0 ? (
          <div className="text-center py-8 text-anthracite-700/60 dark:text-creme-100/60">
            <div className="text-3xl mb-2">🍃</div>
            <p className="text-sm">Aucun repas enregistré aujourd'hui.</p>
            <p className="text-xs mt-1">Scanne ton assiette ou ajoute un repas manuellement.</p>
          </div>
        ) : (
          groupes.map((g) => (
            <div key={g.type} className="space-y-2">
              <div className="text-xs font-medium text-anthracite-700/60 dark:text-creme-100/60">
                {ICONE_TYPE_REPAS[g.type]} {LABEL_TYPE_REPAS[g.type]}
              </div>
              {g.repas.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 bg-white dark:bg-anthracite-800 rounded-xl p-3 shadow-sm animate-pop-in"
                >
                  <div className="w-10 h-10 rounded-lg bg-sauge-100 dark:bg-anthracite-700 flex items-center justify-center text-lg shrink-0">
                    {ICONE_TYPE_REPAS[g.type]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-anthracite-800 dark:text-creme-50 truncate">{r.nom}</div>
                    <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60">{Math.round(r.calories)} kcal</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => supprimer(r.id)}
                    aria-label="Supprimer"
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center text-anthracite-700/50 dark:text-creme-100/50"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </section>

      {modalOuvert && <AjoutRepasManuel onFerme={() => setModalOuvert(false)} />}
    </div>
  )
}
