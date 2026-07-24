import type { Activite, Rythme, Sexe } from '../types'

export const FACTEURS_ACTIVITE: Record<Activite, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
}

export const KCAL_PAR_KG_GRAISSE = 7700
export const DEFICIT_MAX_KCAL = 750
export const PLANCHER_KCAL: Record<Sexe, number> = { femme: 1200, homme: 1500 }

export function calculerIMC(poidsKg: number, tailleCm: number): number {
  const tailleM = tailleCm / 100
  return poidsKg / (tailleM * tailleM)
}

export function categorieIMC(imc: number): string {
  if (imc < 18.5) return 'Insuffisance pondérale'
  if (imc < 25) return 'Corpulence normale'
  if (imc < 30) return 'Surpoids'
  return 'Obésité'
}

export function calculerMetabolismeBase(sexe: Sexe, poidsKg: number, tailleCm: number, age: number): number {
  const base = 10 * poidsKg + 6.25 * tailleCm - 5 * age
  return sexe === 'femme' ? base - 161 : base + 5
}

export function calculerTDEE(mb: number, activite: Activite): number {
  return mb * FACTEURS_ACTIVITE[activite]
}

export interface ResultatObjectif {
  objectifKcal: number
  deficitApplique: number
  deficitReduit: boolean
  imcObjectifTropBas: boolean
}

export function calculerObjectifCalorique(
  tdee: number,
  rythme: Rythme,
  sexe: Sexe,
  poidsObjectifKg: number,
  tailleCm: number,
): ResultatObjectif {
  const imcObjectif = calculerIMC(poidsObjectifKg, tailleCm)
  const imcObjectifTropBas = imcObjectif < 18.5

  if (imcObjectifTropBas) {
    return { objectifKcal: Math.round(tdee), deficitApplique: 0, deficitReduit: false, imcObjectifTropBas: true }
  }

  const deficitSouhaite = Math.min((rythme * KCAL_PAR_KG_GRAISSE) / 7, DEFICIT_MAX_KCAL)
  const plancher = PLANCHER_KCAL[sexe]

  let objectifKcal = tdee - deficitSouhaite
  let deficitReduit = false

  if (objectifKcal < plancher) {
    objectifKcal = plancher
    deficitReduit = true
  }

  const deficitApplique = tdee - objectifKcal

  return { objectifKcal: Math.round(objectifKcal), deficitApplique: Math.round(deficitApplique), deficitReduit, imcObjectifTropBas: false }
}

export function calculerMacrosCibles(objectifKcal: number, repartition = { proteines: 0.3, lipides: 0.3, glucides: 0.4 }) {
  return {
    cibleProteinesG: Math.round((objectifKcal * repartition.proteines) / 4),
    cibleLipidesG: Math.round((objectifKcal * repartition.lipides) / 9),
    cibleGlucidesG: Math.round((objectifKcal * repartition.glucides) / 4),
  }
}

export function calculerDureeEstimee(poidsActuelKg: number, poidsObjectifKg: number, rythme: Rythme): { semaines: number; dateEstimee: Date } {
  const ecartKg = Math.abs(poidsActuelKg - poidsObjectifKg)
  const semaines = ecartKg / rythme
  const dateEstimee = new Date()
  dateEstimee.setDate(dateEstimee.getDate() + Math.round(semaines * 7))
  return { semaines: Math.round(semaines * 10) / 10, dateEstimee }
}

export function moyenneGlissante7j(pesees: { date: string; poidsKg: number }[]): { date: string; moyenne: number }[] {
  const triees = [...pesees].sort((a, b) => a.date.localeCompare(b.date))
  return triees.map((p, i) => {
    const fenetre = triees.slice(Math.max(0, i - 6), i + 1)
    const moyenne = fenetre.reduce((s, x) => s + x.poidsKg, 0) / fenetre.length
    return { date: p.date, moyenne: Math.round(moyenne * 10) / 10 }
  })
}
