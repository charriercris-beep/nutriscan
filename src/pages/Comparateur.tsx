import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { compresserImage } from '../lib/image'
import { comparerPhotos } from '../lib/analyseApi'
import { db } from '../db/schema'
import type { AnalyseIA, ComparaisonIA, TypeRepas } from '../types'
import { aujourdhui, repasPreselectionne } from '../lib/date'
import SelecteurRepasDate from '../components/SelecteurRepasDate'

type Etat = 'attente' | 'chargement' | 'resultat' | 'erreur' | 'confirme'

interface Slot {
  fichier: File | null
  base64: string
  dataUrl: string
}

const SLOT_VIDE: Slot = { fichier: null, base64: '', dataUrl: '' }

export default function Comparateur() {
  const navigate = useNavigate()
  const inputA = useRef<HTMLInputElement>(null)
  const inputB = useRef<HTMLInputElement>(null)

  const [slotA, setSlotA] = useState<Slot>(SLOT_VIDE)
  const [slotB, setSlotB] = useState<Slot>(SLOT_VIDE)
  const [etat, setEtat] = useState<Etat>('attente')
  const [erreur, setErreur] = useState('')
  const [resultat, setResultat] = useState<ComparaisonIA | null>(null)
  const [choix, setChoix] = useState<'A' | 'B' | null>(null)
  const [type, setType] = useState<TypeRepas>(repasPreselectionne())
  const [date, setDate] = useState(aujourdhui())

  const profil = useLiveQuery(() => db.profil.get(1), [])
  const repasAujourdhui = useLiveQuery(() => db.repas.where('date').equals(aujourdhui()).toArray(), []) ?? []

  async function choisirPhoto(fichier: File, cote: 'A' | 'B') {
    const { base64, dataUrl } = await compresserImage(fichier)
    const slot = { fichier, base64, dataUrl }
    if (cote === 'A') setSlotA(slot)
    else setSlotB(slot)
  }

  async function lancerComparaison() {
    if (!slotA.base64 || !slotB.base64) return
    setEtat('chargement')
    setErreur('')
    try {
      const r = await comparerPhotos(slotA.base64, slotB.base64)
      setResultat(r)
      setChoix(r.comparaison.recommandee)
      setEtat('resultat')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Une erreur est survenue.')
      setEtat('erreur')
    }
  }

  function reessayer() {
    setEtat('attente')
    setErreur('')
    setResultat(null)
    setSlotA(SLOT_VIDE)
    setSlotB(SLOT_VIDE)
  }

  async function ajouterOptionChoisie() {
    if (!resultat || !choix) return
    const option: AnalyseIA = resultat.options[choix === 'A' ? 0 : 1]
    const photoBlob = choix === 'A' ? slotA.fichier ?? undefined : slotB.fichier ?? undefined
    await db.repas.add({
      date,
      type,
      nom: option.plat,
      photoBlob,
      portionG: option.portion_estimee_g,
      calories: option.calories,
      proteinesG: option.proteines_g,
      lipidesG: option.lipides_g,
      lipidesSaturesG: option.lipides_satures_g,
      glucidesG: option.glucides_g,
      sucresG: option.sucres_g,
      fibresG: option.fibres_g,
      selG: option.sel_g,
      confiance: option.confiance,
      modifieManuellement: false,
      creeLe: Date.now(),
    })
    setEtat('confirme')
    setTimeout(() => navigate('/'), 900)
  }

  const restantKcal = profil
    ? profil.objectifKcal - repasAujourdhui.reduce((s, r) => s + r.calories, 0)
    : null
  const proteinesConsommees = repasAujourdhui.reduce((s, r) => s + r.proteinesG, 0)
  const proteinesRestantes = profil ? profil.cibleProteinesG - proteinesConsommees : null

  return (
    <div className="p-4 space-y-5 pb-8">
      <h1 className="text-2xl font-bold text-anthracite-800 dark:text-creme-50">Comparer deux menus</h1>

      <input
        ref={inputA}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) choisirPhoto(f, 'A')
        }}
      />
      <input
        ref={inputB}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) choisirPhoto(f, 'B')
        }}
      />

      {(etat === 'attente' || etat === 'chargement') && (
        <>
          <p className="text-sm text-anthracite-700/70 dark:text-creme-100/70">
            Photographie un plat ou une carte de menu pour chaque option.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <EmplacementPhoto label="Option A" dataUrl={slotA.dataUrl} onClick={() => inputA.current?.click()} />
            <EmplacementPhoto label="Option B" dataUrl={slotB.dataUrl} onClick={() => inputB.current?.click()} />
          </div>

          {etat === 'chargement' ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-4 border-sauge-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-anthracite-700/70 dark:text-creme-100/70">Comparaison en cours…</p>
            </div>
          ) : (
            <button
              type="button"
              disabled={!slotA.base64 || !slotB.base64}
              onClick={lancerComparaison}
              className="w-full min-h-[52px] rounded-xl bg-sauge-600 disabled:opacity-40 text-white font-semibold active:scale-[0.98] transition-transform"
            >
              Comparer
            </button>
          )}
        </>
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

      {etat === 'resultat' && resultat && (
        <div className="space-y-4 animate-pop-in">
          <div className="grid grid-cols-2 gap-3">
            {(['A', 'B'] as const).map((cote, i) => {
              const opt = resultat.options[i]
              const estRecommandee = resultat.comparaison.recommandee === cote
              return (
                <button
                  key={cote}
                  type="button"
                  onClick={() => setChoix(cote)}
                  className={`text-left rounded-2xl p-3 border-2 transition-colors ${
                    choix === cote
                      ? 'border-sauge-500 bg-sauge-50 dark:bg-sauge-700/20'
                      : 'border-sauge-100 dark:border-anthracite-700 bg-white dark:bg-anthracite-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-anthracite-700/70 dark:text-creme-100/70">Option {cote}</span>
                    {estRecommandee && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sauge-500 text-white font-medium">
                        ✅ Recommandé
                      </span>
                    )}
                  </div>
                  {(cote === 'A' ? slotA.dataUrl : slotB.dataUrl) && (
                    <img
                      src={cote === 'A' ? slotA.dataUrl : slotB.dataUrl}
                      alt=""
                      className="w-full h-20 object-cover rounded-lg mb-2"
                    />
                  )}
                  <div className="text-sm font-medium text-anthracite-800 dark:text-creme-50 line-clamp-1">{opt.plat}</div>
                  <div className="text-2xl font-bold text-anthracite-800 dark:text-creme-50 mt-1">{opt.calories}</div>
                  <div className="text-xs text-anthracite-700/60 dark:text-creme-100/60">kcal</div>
                </button>
              )
            })}
          </div>

          <div className="text-center text-sm text-anthracite-700/70 dark:text-creme-100/70">
            Écart : {Math.abs(resultat.comparaison.ecart_kcal)} kcal (
            {Math.round((Math.abs(resultat.comparaison.ecart_kcal) / Math.max(1, resultat.options[0].calories)) * 100)}%)
          </div>

          <div className="bg-white dark:bg-anthracite-800 rounded-2xl p-4 shadow-sm space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-sauge-700 dark:text-sauge-300">
              Comparaison macro par macro
            </h2>
            <TableauMacros a={resultat.options[0]} b={resultat.options[1]} />
          </div>

          <div className="bg-sauge-50 dark:bg-anthracite-800 rounded-2xl p-4 space-y-2">
            <p className="text-sm text-anthracite-800 dark:text-creme-50">{resultat.comparaison.justification}</p>
            {restantKcal !== null && proteinesRestantes !== null && (
              <p className="text-xs text-anthracite-700/70 dark:text-creme-100/70">
                Il te reste {Math.max(0, Math.round(restantKcal))} kcal et environ{' '}
                {Math.max(0, Math.round(proteinesRestantes))} g de protéines pour aujourd'hui.
              </p>
            )}
          </div>

          <SelecteurRepasDate type={type} onTypeChange={setType} date={date} onDateChange={setDate} />

          <button
            type="button"
            disabled={!choix}
            onClick={ajouterOptionChoisie}
            className="w-full min-h-[52px] rounded-xl bg-sauge-600 disabled:opacity-40 text-white font-semibold active:scale-[0.98] transition-transform"
          >
            Ajouter l'option choisie à mon planning
          </button>
        </div>
      )}
    </div>
  )
}

function EmplacementPhoto({ label, dataUrl, onClick }: { label: string; dataUrl: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="aspect-square rounded-2xl border-2 border-dashed border-sauge-300 dark:border-anthracite-700 flex flex-col items-center justify-center gap-1 overflow-hidden bg-white dark:bg-anthracite-800"
    >
      {dataUrl ? (
        <img src={dataUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        <>
          <span className="text-2xl">📷</span>
          <span className="text-xs font-medium text-anthracite-700/70 dark:text-creme-100/70">{label}</span>
        </>
      )}
    </button>
  )
}

function TableauMacros({ a, b }: { a: AnalyseIA; b: AnalyseIA }) {
  const lignes: [string, number, number, string][] = [
    ['Protéines', a.proteines_g, b.proteines_g, 'g'],
    ['Lipides', a.lipides_g, b.lipides_g, 'g'],
    ['Glucides', a.glucides_g, b.glucides_g, 'g'],
    ['Fibres', a.fibres_g, b.fibres_g, 'g'],
    ['Sel', a.sel_g, b.sel_g, 'g'],
  ]
  return (
    <div className="space-y-2">
      {lignes.map(([label, va, vb, unite]) => {
        const max = Math.max(va, vb, 1)
        return (
          <div key={label} className="text-xs">
            <div className="text-center font-medium text-anthracite-700 dark:text-creme-100 mb-0.5">{label}</div>
            <div className="grid grid-cols-2 gap-2 items-center">
              <div className="flex items-center gap-1 justify-end">
                <span>{va} {unite}</span>
                <div className="h-2 flex-1 max-w-[60px] bg-sauge-100 dark:bg-anthracite-700 rounded-full overflow-hidden">
                  <div className="h-full bg-sauge-500 ml-auto rounded-full" style={{ width: `${(va / max) * 100}%` }} />
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 flex-1 max-w-[60px] bg-sauge-100 dark:bg-anthracite-700 rounded-full overflow-hidden">
                  <div className="h-full bg-accent-500 rounded-full" style={{ width: `${(vb / max) * 100}%` }} />
                </div>
                <span>{vb} {unite}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
