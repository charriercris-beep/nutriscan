import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import { aujourdhui, joursDeLaSemaine } from '../lib/date'
import { agregerParJour, serieJoursDansObjectif, moyenne } from '../lib/planning'
import CourbePoids from '../components/CourbePoids'

export default function Statistiques() {
  const profil = useLiveQuery(() => db.profil.get(1), [])
  const pesees = useLiveQuery(() => db.pesees.orderBy('date').toArray(), []) ?? []
  const jours7 = useMemo(() => joursDeLaSemaine(aujourdhui()), [])
  const repas = useLiveQuery(() => db.repas.toArray(), []) ?? []

  const totauxSemaine = useMemo(() => agregerParJour(repas, jours7), [repas, jours7])
  const objectifKcal = profil?.objectifKcal ?? 2000

  const moyenneCalories = useMemo(
    () => moyenne(totauxSemaine.filter((t) => t.calories > 0).map((t) => t.calories)),
    [totauxSemaine],
  )
  const moyenneProteines = useMemo(
    () => moyenne(totauxSemaine.filter((t) => t.calories > 0).map((t) => t.proteinesG)),
    [totauxSemaine],
  )
  const moyenneLipides = useMemo(
    () => moyenne(totauxSemaine.filter((t) => t.calories > 0).map((t) => t.lipidesG)),
    [totauxSemaine],
  )
  const moyenneGlucides = useMemo(
    () => moyenne(totauxSemaine.filter((t) => t.calories > 0).map((t) => t.glucidesG)),
    [totauxSemaine],
  )

  const totauxToutTemps = useMemo(() => {
    const dates = Array.from(new Set(repas.map((r) => r.date))).sort()
    return agregerParJour(repas, dates)
  }, [repas])
  const serie = useMemo(() => serieJoursDansObjectif(totauxToutTemps, objectifKcal), [totauxToutTemps, objectifKcal])

  const aDesDonnees = repas.length > 0

  return (
    <div className="p-4 space-y-5 pb-8">
      <h1 className="text-2xl font-bold text-anthracite-800 dark:text-creme-50">Statistiques</h1>

      {!aDesDonnees ? (
        <div className="text-center py-10 text-anthracite-700/60 dark:text-creme-100/60">
          <div className="text-3xl mb-2">📊</div>
          <p className="text-sm">Pas encore assez de données. Scanne quelques repas pour voir tes statistiques.</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Carte label="Moyenne hebdo" valeur={`${Math.round(moyenneCalories)} kcal`} />
            <Carte label="Série dans l'objectif" valeur={`${serie} jour${serie > 1 ? 's' : ''}`} />
          </section>

          <section className="bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">
              Répartition macro moyenne (7 j)
            </h2>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="font-semibold text-anthracite-800 dark:text-creme-50">{Math.round(moyenneProteines)} g</div>
                <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60">Protéines</div>
              </div>
              <div>
                <div className="font-semibold text-anthracite-800 dark:text-creme-50">{Math.round(moyenneLipides)} g</div>
                <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60">Lipides</div>
              </div>
              <div>
                <div className="font-semibold text-anthracite-800 dark:text-creme-50">{Math.round(moyenneGlucides)} g</div>
                <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60">Glucides</div>
              </div>
            </div>
          </section>
        </>
      )}

      <section className="bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300 mb-2">
          Courbe de poids
        </h2>
        <CourbePoids pesees={pesees} objectifKg={profil?.poidsObjectifKg} />
      </section>
    </div>
  )
}

function Carte({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm text-center">
      <div className="text-xl font-bold text-anthracite-800 dark:text-creme-50">{valeur}</div>
      <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60 mt-1">{label}</div>
    </div>
  )
}
