export type Sexe = 'femme' | 'homme'
export type Activite = 'sedentaire' | 'leger' | 'modere' | 'actif' | 'tres_actif'
export type Rythme = 0.25 | 0.5 | 0.75
export type TypeRepas = 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation'
export type Confiance = 'elevee' | 'moyenne' | 'faible'

export interface Profil {
  id: 1
  sexe: Sexe
  age: number
  tailleCm: number
  poidsKg: number
  poidsObjectifKg: number
  activite: Activite
  rythme: Rythme
  objectifKcal: number
  cibleProteinesG: number
  cibleLipidesG: number
  cibleGlucidesG: number
  deficitReduit?: boolean
}

export interface Repas {
  id?: number
  date: string
  type: TypeRepas
  nom: string
  photoBlob?: Blob
  portionG: number
  calories: number
  proteinesG: number
  lipidesG: number
  lipidesSaturesG: number
  glucidesG: number
  sucresG: number
  fibresG: number
  selG: number
  confiance: Confiance
  modifieManuellement: boolean
  creeLe: number
}

export interface Pesee {
  id?: number
  date: string
  poidsKg: number
}

export interface AnalyseIA {
  plat: string
  description: string
  portion_estimee_g: number
  aliments_detectes: { nom: string; quantite_g: number; calories: number }[]
  calories: number
  proteines_g: number
  lipides_g: number
  lipides_satures_g: number
  glucides_g: number
  sucres_g: number
  fibres_g: number
  sel_g: number
  confiance: Confiance
  remarque: string
}

export interface ComparaisonIA {
  options: [AnalyseIA, AnalyseIA]
  comparaison: { recommandee: 'A' | 'B'; ecart_kcal: number; justification: string }
}
