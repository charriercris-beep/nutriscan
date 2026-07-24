import { useState, useEffect, useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/schema'
import type { Activite, Profil as ProfilType, Rythme, Sexe } from '../types'
import {
  calculerIMC,
  categorieIMC,
  calculerMetabolismeBase,
  calculerTDEE,
  calculerObjectifCalorique,
  calculerMacrosCibles,
  calculerDureeEstimee,
  moyenneGlissante7j,
} from '../lib/calculs'
import { aujourdhui } from '../lib/date'
import ToggleModeSombre from '../components/ToggleModeSombre'
import CourbePoids from '../components/CourbePoids'

const ACTIVITES: { valeur: Activite; label: string; description: string }[] = [
  { valeur: 'sedentaire', label: 'Sédentaire', description: 'Bureau, peu de marche' },
  { valeur: 'leger', label: 'Légèrement actif', description: '1 à 3 séances/semaine' },
  { valeur: 'modere', label: 'Modérément actif', description: '3 à 5 séances/semaine' },
  { valeur: 'actif', label: 'Très actif', description: '6 à 7 séances/semaine' },
  { valeur: 'tres_actif', label: 'Extrêmement actif', description: 'Travail physique + sport' },
]

const RYTHMES: { valeur: Rythme; label: string }[] = [
  { valeur: 0.25, label: 'Doux — 0,25 kg/sem' },
  { valeur: 0.5, label: 'Modéré — 0,5 kg/sem' },
  { valeur: 0.75, label: 'Soutenu — 0,75 kg/sem' },
]

function couleurIMC(imc: number) {
  if (imc < 18.5) return '#e08e45'
  if (imc < 25) return '#6d8c60'
  if (imc < 30) return '#e08e45'
  return '#c8752f'
}

export default function Profil() {
  const profilExistant = useLiveQuery(() => db.profil.get(1), [])
  const pesees = useLiveQuery(() => db.pesees.orderBy('date').toArray(), []) ?? []

  const [sexe, setSexe] = useState<Sexe>('femme')
  const [age, setAge] = useState(30)
  const [tailleCm, setTailleCm] = useState(165)
  const [poidsKg, setPoidsKg] = useState(70)
  const [poidsObjectifKg, setPoidsObjectifKg] = useState(65)
  const [activite, setActivite] = useState<Activite>('leger')
  const [rythme, setRythme] = useState<Rythme>(0.5)
  const [repartition, setRepartition] = useState({ proteines: 0.3, lipides: 0.3, glucides: 0.4 })
  const [charge, setCharge] = useState(false)

  const [nouvellePeseeDate, setNouvellePeseeDate] = useState(aujourdhui())
  const [nouvellePeseePoids, setNouvellePeseePoids] = useState('')

  useEffect(() => {
    if (profilExistant && !charge) {
      setSexe(profilExistant.sexe)
      setAge(profilExistant.age)
      setTailleCm(profilExistant.tailleCm)
      setPoidsKg(profilExistant.poidsKg)
      setPoidsObjectifKg(profilExistant.poidsObjectifKg)
      setActivite(profilExistant.activite)
      setRythme(profilExistant.rythme)
      setCharge(true)
    }
  }, [profilExistant, charge])

  const imc = useMemo(() => calculerIMC(poidsKg, tailleCm), [poidsKg, tailleCm])
  const mb = useMemo(() => calculerMetabolismeBase(sexe, poidsKg, tailleCm, age), [sexe, poidsKg, tailleCm, age])
  const tdee = useMemo(() => calculerTDEE(mb, activite), [mb, activite])
  const resultatObjectif = useMemo(
    () => calculerObjectifCalorique(tdee, rythme, sexe, poidsObjectifKg, tailleCm),
    [tdee, rythme, sexe, poidsObjectifKg, tailleCm],
  )
  const macros = useMemo(() => calculerMacrosCibles(resultatObjectif.objectifKcal, repartition), [resultatObjectif, repartition])
  const duree = useMemo(() => calculerDureeEstimee(poidsKg, poidsObjectifKg, rythme), [poidsKg, poidsObjectifKg, rythme])
  const moyennes = useMemo(() => moyenneGlissante7j(pesees), [pesees])

  async function enregistrer() {
    const profil: ProfilType = {
      id: 1,
      sexe,
      age,
      tailleCm,
      poidsKg,
      poidsObjectifKg,
      activite,
      rythme,
      objectifKcal: resultatObjectif.objectifKcal,
      cibleProteinesG: macros.cibleProteinesG,
      cibleLipidesG: macros.cibleLipidesG,
      cibleGlucidesG: macros.cibleGlucidesG,
      deficitReduit: resultatObjectif.deficitReduit,
    }
    await db.profil.put(profil)
  }

  async function ajouterPesee() {
    const poids = parseFloat(nouvellePeseePoids)
    if (!poids || poids <= 0) return
    await db.pesees.add({ date: nouvellePeseeDate, poidsKg: poids })
    setNouvellePeseePoids('')
    setPoidsKg(poids)
  }

  return (
    <div className="p-4 space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-anthracite-800 dark:text-creme-50">Mon profil</h1>
        <ToggleModeSombre />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Informations</h2>

        <div className="flex gap-2">
          {(['femme', 'homme'] as Sexe[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSexe(s)}
              className={`flex-1 min-h-[44px] rounded-xl border-2 font-medium capitalize transition-colors ${
                sexe === s
                  ? 'border-sauge-500 bg-sauge-50 text-sauge-700 dark:bg-sauge-700/20 dark:text-sauge-300'
                  : 'border-sauge-100 dark:border-anthracite-700 text-anthracite-700 dark:text-creme-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <Champ label="Âge (années)" valeur={age} onChange={setAge} unite="ans" />
        <Champ label="Taille (cm)" valeur={tailleCm} onChange={setTailleCm} unite="cm" />
        <Champ label="Poids actuel (kg)" valeur={poidsKg} onChange={setPoidsKg} unite="kg" pas={0.1} />
        <Champ label="Poids objectif (kg)" valeur={poidsObjectifKg} onChange={setPoidsObjectifKg} unite="kg" pas={0.1} />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Niveau d'activité</h2>
        {ACTIVITES.map((a) => (
          <label
            key={a.valeur}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer min-h-[44px] ${
              activite === a.valeur
                ? 'border-sauge-500 bg-sauge-50 dark:bg-sauge-700/20'
                : 'border-sauge-100 dark:border-anthracite-700'
            }`}
          >
            <input
              type="radio"
              name="activite"
              checked={activite === a.valeur}
              onChange={() => setActivite(a.valeur)}
              className="mt-1 accent-sauge-600"
            />
            <div>
              <div className="font-medium text-anthracite-800 dark:text-creme-50">{a.label}</div>
              <div className="text-xs text-anthracite-700/70 dark:text-creme-100/70">{a.description}</div>
            </div>
          </label>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Rythme souhaité</h2>
        <div className="flex flex-col gap-2">
          {RYTHMES.map((r) => (
            <button
              key={r.valeur}
              type="button"
              onClick={() => setRythme(r.valeur)}
              className={`min-h-[44px] rounded-xl border-2 px-3 text-left font-medium ${
                rythme === r.valeur
                  ? 'border-sauge-500 bg-sauge-50 text-sauge-700 dark:bg-sauge-700/20 dark:text-sauge-300'
                  : 'border-sauge-100 dark:border-anthracite-700 text-anthracite-700 dark:text-creme-100'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Résultats</h2>

        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ backgroundColor: couleurIMC(imc) }}
          >
            {imc.toFixed(1)}
          </div>
          <div>
            <div className="font-semibold text-anthracite-800 dark:text-creme-50">IMC : {imc.toFixed(1)}</div>
            <div className="text-sm text-anthracite-700/70 dark:text-creme-100/70">{categorieIMC(imc)}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <StatCard label="Métabolisme de base" valeur={`${Math.round(mb)} kcal`} />
          <StatCard label="Dépense totale (TDEE)" valeur={`${Math.round(tdee)} kcal`} />
        </div>

        {resultatObjectif.imcObjectifTropBas ? (
          <div className="bg-accent-500/10 border border-accent-500/40 text-accent-600 dark:text-accent-500 rounded-xl p-3 text-sm">
            Le poids objectif choisi correspond à un IMC inférieur à 18,5. Pour ta sécurité, nous ne proposons pas de plan
            de perte en dessous de ce seuil. Parles-en avec un professionnel de santé si tu penses que c'est adapté à ta
            situation.
          </div>
        ) : (
          <>
            <div className="text-center py-2">
              <div className="text-4xl font-bold text-sauge-700 dark:text-sauge-300">{resultatObjectif.objectifKcal}</div>
              <div className="text-sm text-anthracite-700/70 dark:text-creme-100/70">kcal / jour objectif</div>
            </div>
            {resultatObjectif.deficitReduit && (
              <div className="bg-accent-500/10 border border-accent-500/40 text-accent-600 dark:text-accent-500 rounded-xl p-3 text-sm">
                Nous avons réduit le déficit pour rester dans une zone sûre.
              </div>
            )}
            <div className="text-sm text-anthracite-700/80 dark:text-creme-100/80">
              Durée estimée : <strong>{duree.semaines} semaines</strong> — objectif prévu vers le{' '}
              <strong>{duree.dateEstimee.toLocaleDateString('fr-FR')}</strong>
            </div>
          </>
        )}

        <div className="space-y-1 pt-2">
          <div className="text-xs font-medium text-anthracite-700/70 dark:text-creme-100/70">Répartition des macros cibles</div>
          <div className="flex gap-2 text-xs">
            <RepartitionInput label="Prot." valeur={repartition.proteines} onChange={(v) => setRepartition({ ...repartition, proteines: v })} />
            <RepartitionInput label="Lip." valeur={repartition.lipides} onChange={(v) => setRepartition({ ...repartition, lipides: v })} />
            <RepartitionInput label="Gluc." valeur={repartition.glucides} onChange={(v) => setRepartition({ ...repartition, glucides: v })} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div>{macros.cibleProteinesG} g protéines</div>
            <div>{macros.cibleLipidesG} g lipides</div>
            <div>{macros.cibleGlucidesG} g glucides</div>
          </div>
        </div>

        <button
          type="button"
          onClick={enregistrer}
          className="w-full min-h-[48px] rounded-xl bg-sauge-600 text-white font-semibold active:scale-[0.98] transition-transform"
        >
          Enregistrer mon profil
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">Suivi du poids</h2>
        <div className="flex gap-2">
          <input
            type="date"
            value={nouvellePeseeDate}
            onChange={(e) => setNouvellePeseeDate(e.target.value)}
            className="flex-1 min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-800 px-3"
          />
          <input
            type="number"
            step="0.1"
            placeholder="Poids (kg)"
            value={nouvellePeseePoids}
            onChange={(e) => setNouvellePeseePoids(e.target.value)}
            className="w-28 min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-800 px-3"
          />
          <button
            type="button"
            onClick={ajouterPesee}
            className="min-h-[44px] px-4 rounded-xl bg-sauge-600 text-white font-semibold"
          >
            Ajouter
          </button>
        </div>

        <div className="bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm">
          <CourbePoids pesees={pesees} objectifKg={poidsObjectifKg} />
          {moyennes.length > 0 && (
            <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60 mt-2">
              Moyenne glissante (7 j) la plus récente : {moyennes[moyennes.length - 1].moyenne} kg
            </div>
          )}
        </div>
      </section>

      <p className="text-xs text-center text-anthracite-700/60 dark:text-creme-100/60 pt-4 border-t border-sauge-100 dark:border-anthracite-700">
        Ces estimations sont indicatives et ne remplacent pas l'avis d'un professionnel de santé.
      </p>
    </div>
  )
}

function Champ({
  label,
  valeur,
  onChange,
  unite,
  pas = 1,
}: {
  label: string
  valeur: number
  onChange: (v: number) => void
  unite: string
  pas?: number
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-anthracite-700 dark:text-creme-100">{label}</span>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="number"
          step={pas}
          value={valeur}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="flex-1 min-h-[44px] rounded-xl border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-800 px-3"
        />
        <span className="text-sm text-anthracite-700/60 dark:text-creme-100/60">{unite}</span>
      </div>
    </label>
  )
}

function StatCard({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="bg-sauge-50 dark:bg-anthracite-700/40 rounded-xl p-3">
      <div className="text-xs text-anthracite-700/70 dark:text-creme-100/70">{label}</div>
      <div className="font-semibold text-anthracite-800 dark:text-creme-50">{valeur}</div>
    </div>
  )
}

function RepartitionInput({ label, valeur, onChange }: { label: string; valeur: number; onChange: (v: number) => void }) {
  return (
    <label className="flex-1 text-center">
      <div>{label}</div>
      <input
        type="number"
        min={0}
        max={100}
        value={Math.round(valeur * 100)}
        onChange={(e) => onChange((parseFloat(e.target.value) || 0) / 100)}
        className="w-full min-h-[36px] rounded-lg border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-800 text-center"
      />
      <div>%</div>
    </label>
  )
}
