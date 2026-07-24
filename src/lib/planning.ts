import type { Repas } from '../types'

export interface TotalJour {
  date: string
  calories: number
  proteinesG: number
  lipidesG: number
  glucidesG: number
}

/** Agrège les repas par jour pour une liste de dates données (ordre conservé). */
export function agregerParJour(repas: Repas[], jours: string[]): TotalJour[] {
  return jours.map((date) => {
    const duJour = repas.filter((r) => r.date === date)
    return {
      date,
      calories: duJour.reduce((s, r) => s + r.calories, 0),
      proteinesG: duJour.reduce((s, r) => s + r.proteinesG, 0),
      lipidesG: duJour.reduce((s, r) => s + r.lipidesG, 0),
      glucidesG: duJour.reduce((s, r) => s + r.glucidesG, 0),
    }
  })
}

/** Nombre de jours consécutifs (en partant du plus récent) où le total est <= objectif (et > 0). */
export function serieJoursDansObjectif(totaux: TotalJour[], objectifKcal: number): number {
  const tries = [...totaux].sort((a, b) => b.date.localeCompare(a.date))
  let serie = 0
  for (const t of tries) {
    if (t.calories === 0) break
    if (t.calories <= objectifKcal) serie++
    else break
  }
  return serie
}

export function moyenne(nombres: number[]): number {
  if (nombres.length === 0) return 0
  return nombres.reduce((s, n) => s + n, 0) / nombres.length
}
