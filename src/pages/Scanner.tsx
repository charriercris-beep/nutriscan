import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { compresserImage } from '../lib/image'
import { analyserPhoto, ajusterPourPortion } from '../lib/analyseApi'
import { db } from '../db/schema'
import type { AnalyseIA, TypeRepas } from '../types'
import { aujourdhui, repasPreselectionne } from '../lib/date'
import { LABEL_CONFIANCE } from '../lib/labels'
import SelecteurRepasDate from '../components/SelecteurRepasDate'
import MacroBar from '../components/MacroBar'

type Etat = 'attente' | 'chargement' | 'resultat' | 'erreur' | 'confirme'

const PORTIONS = [0.5, 1, 1.5, 2]

export default function Scanner() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)

  const [etat, setEtat] = useState<Etat>('attente')
  const [erreur, setErreur] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string>('')
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [analyse, setAnalyse] = useState<AnalyseIA | null>(null)
  const [portionBase, setPortionBase] = useState(0)
  const [facteurPortion, setFacteurPortion] = useState<number | 'libre'>(1)
  const [grammesLibres, setGrammesLibres] = useState('')

  const [type, setType] = useState<TypeRepas>(repasPreselectionne())
  const [date, setDate] = useState(aujourdhui())

  async function surSelectionFichier(fichier: File) {
    setEtat('chargement')
    setErreur('')
    try {
      const { blob, base64, dataUrl } = await compresserImage(fichier)
      setPhotoBlob(blob)
      setPhotoUrl(dataUrl)
      const resultat = await analyserPhoto(base64)
      setAnalyse(resultat)
      setPortionBase(resultat.portion_estimee_g)
      setFacteurPortion(1)
      setEtat('resultat')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setEtat('erreur')
    }
  }

  function grammesActuels(): number {
    if (facteurPortion === 'libre') return parseFloat(grammesLibres) || portionBase
    return portionBase * facteurPortion
  }

  const analyseAjustee = analyse ? ajusterPourPortion(analyse, grammesActuels()) : null

  function modifierChamp<K extends keyof AnalyseIA>(champ: K, valeur: AnalyseIA[K]) {
    if (!analyse) return
    setAnalyse({ ...analyse, [champ]: valeur })
  }

  async function ajouterAuPlanning() {
    if (!analyseAjustee) return
    await db.repas.add({
      date,
      type,
      nom: analyseAjustee.plat,
      photoBlob: photoBlob ?? undefined,
      portionG: analyseAjustee.portion_estimee_g,
      calories: analyseAjustee.calories,
      proteinesG: analyseAjustee.proteines_g,
      lipidesG: analyseAjustee.lipides_g,
      lipidesSaturesG: analyseAjustee.lipides_satures_g,
      glucidesG: analyseAjustee.glucides_g,
      sucresG: analyseAjustee.sucres_g,
      fibresG: analyseAjustee.fibres_g,
      selG: analyseAjustee.sel_g,
      confiance: analyseAjustee.confiance,
      modifieManuellement: false,
      creeLe: Date.now(),
    })
    setEtat('confirme')
    setTimeout(() => navigate('/'), 900)
  }

  function reessayer() {
    setEtat('attente')
    setErreur('')
    setAnalyse(null)
    setPhotoUrl('')
    setPhotoBlob(null)
  }

  return (
    <div className="p-4 space-y-5 pb-8">
      <h1 className="text-2xl font-bold text-anthracite-800 dark:text-creme-50">Scanner mon plat</h1>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) surSelectionFichier(f)
        }}
      />

      {etat === 'attente' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="text-5xl">📷</div>
          <p className="text-center text-anthracite-700/70 dark:text-creme-100/70 max-w-xs">
            Prends en photo ton assiette ou choisis une image dans ta galerie.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="min-h-[52px] px-8 rounded-xl bg-sauge-600 text-white font-semibold active:scale-[0.98] transition-transform"
          >
            Prendre / choisir une photo
          </button>
        </div>
      )}

      {etat === 'chargement' && (
        <div className="flex flex-col items-center gap-4 py-16">
          {photoUrl && <img src={photoUrl} alt="" className="w-40 h-40 object-cover rounded-2xl opacity-60" />}
          <div className="w-8 h-8 border-4 border-sauge-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-anthracite-700/70 dark:text-creme-100/70">Analyse en cours…</p>
        </div>
      )}

      {etat === 'erreur' && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="text-4xl">😕</div>
          <p className="text-center text-anthracite-700/70 dark:text-creme-100/70">{erreur}</p>
          <button
            type="button"
            onClick={reessayer}
            className="min-h-[48px] px-6 rounded-xl bg-sauge-600 text-white font-semibold"
          >
            Réessayer
          </button>
        </div>
      )}

      {etat === 'confirme' && (
        <div className="flex flex-col items-center gap-3 py-16 animate-pop-in">
          <div className="text-5xl">✅</div>
          <p className="text-anthracite-800 dark:text-creme-50 font-semibold">Ajouté à ton planning !</p>
        </div>
      )}

      {etat === 'resultat' && analyse && analyseAjustee && (
        <div className="space-y-4 animate-pop-in">
          {photoUrl && <img src={photoUrl} alt="" className="w-full h-48 object-cover rounded-2xl" />}

          <div>
            <input
              value={analyse.plat}
              onChange={(e) => modifierChamp('plat', e.target.value)}
              className="w-full text-lg font-bold bg-transparent border-b border-sauge-100 dark:border-anthracite-700 pb-1 text-anthracite-800 dark:text-creme-50"
            />
            <input
              value={analyse.description}
              onChange={(e) => modifierChamp('description', e.target.value)}
              className="w-full text-sm mt-1 bg-transparent text-anthracite-700/70 dark:text-creme-100/70"
            />
          </div>

          <span className="inline-block text-xs px-2 py-1 rounded-full bg-sauge-100 dark:bg-anthracite-700 text-sauge-700 dark:text-sauge-300 font-medium">
            {LABEL_CONFIANCE[analyse.confiance]} — estimation
          </span>

          <div className="text-center py-2">
            <div className="text-5xl font-bold text-anthracite-800 dark:text-creme-50">{analyseAjustee.calories}</div>
            <div className="text-sm text-anthracite-700/60 dark:text-creme-100/60">kcal</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-anthracite-700/70 dark:text-creme-100/70">Portion</div>
            <div className="flex gap-2">
              {PORTIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFacteurPortion(p)}
                  className={`flex-1 min-h-[40px] rounded-lg border-2 text-sm font-medium ${
                    facteurPortion === p
                      ? 'border-sauge-500 bg-sauge-50 text-sauge-700 dark:bg-sauge-700/20 dark:text-sauge-300'
                      : 'border-sauge-100 dark:border-anthracite-700 text-anthracite-700 dark:text-creme-100'
                  }`}
                >
                  {p}×
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                placeholder={`ou grammes libres (base ${portionBase} g)`}
                value={grammesLibres}
                onChange={(e) => {
                  setGrammesLibres(e.target.value)
                  setFacteurPortion('libre')
                }}
                className="flex-1 min-h-[40px] rounded-lg border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-800 px-3 text-sm"
              />
              <span className="text-xs text-anthracite-700/60 dark:text-creme-100/60">g</span>
            </div>
          </div>

          <div className="space-y-3 bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm">
            <MacroBar label="Protéines" valeur={analyseAjustee.proteines_g} cible={Math.max(analyseAjustee.proteines_g, 1)} unite="g" />
            <MacroBar label="Lipides" valeur={analyseAjustee.lipides_g} cible={Math.max(analyseAjustee.lipides_g, 1)} unite="g" couleur="#e08e45" />
            <div className="text-xs pl-2 text-anthracite-700/60 dark:text-creme-100/60">
              dont saturés : {analyseAjustee.lipides_satures_g} g
            </div>
            <MacroBar label="Glucides" valeur={analyseAjustee.glucides_g} cible={Math.max(analyseAjustee.glucides_g, 1)} unite="g" couleur="#6d8c60" />
            <div className="text-xs pl-2 text-anthracite-700/60 dark:text-creme-100/60">dont sucres : {analyseAjustee.sucres_g} g</div>
            <div className="grid grid-cols-2 gap-3 text-sm pt-1">
              <div>Fibres : {analyseAjustee.fibres_g} g</div>
              <div>Sel : {analyseAjustee.sel_g} g</div>
            </div>
          </div>

          <details className="text-sm">
            <summary className="font-medium text-sauge-700 dark:text-sauge-300 cursor-pointer">Corriger les valeurs manuellement</summary>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(
                [
                  ['calories', 'Calories'],
                  ['proteines_g', 'Protéines (g)'],
                  ['lipides_g', 'Lipides (g)'],
                  ['lipides_satures_g', 'dont saturés (g)'],
                  ['glucides_g', 'Glucides (g)'],
                  ['sucres_g', 'dont sucres (g)'],
                  ['fibres_g', 'Fibres (g)'],
                  ['sel_g', 'Sel (g)'],
                ] as [keyof AnalyseIA, string][]
              ).map(([champ, label]) => (
                <label key={champ} className="text-xs">
                  {label}
                  <input
                    type="number"
                    value={Number(analyseAjustee[champ])}
                    onChange={(e) => {
                      // Édition manuelle : on fige la portion courante et on remplace la valeur brute
                      const nouveau = { ...analyse, portion_estimee_g: grammesActuels() }
                      ;(nouveau as unknown as Record<string, number>)[champ as string] = parseFloat(e.target.value) || 0
                      setAnalyse(nouveau)
                      setPortionBase(grammesActuels())
                      setFacteurPortion(1)
                    }}
                    className="w-full min-h-[36px] rounded-lg border border-sauge-100 dark:border-anthracite-700 dark:bg-anthracite-900 px-2 mt-0.5"
                  />
                </label>
              ))}
            </div>
          </details>

          {analyse.remarque && (
            <p className="text-xs italic text-anthracite-700/60 dark:text-creme-100/60">{analyse.remarque}</p>
          )}

          <SelecteurRepasDate type={type} onTypeChange={setType} date={date} onDateChange={setDate} />

          <button
            type="button"
            onClick={ajouterAuPlanning}
            className="w-full min-h-[52px] rounded-xl bg-sauge-600 text-white font-semibold active:scale-[0.98] transition-transform"
          >
            Ajouter au planning
          </button>
        </div>
      )}
    </div>
  )
}
