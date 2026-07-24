import type { Confiance, TypeRepas } from '../types'

export const LABEL_TYPE_REPAS: Record<TypeRepas, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
  collation: 'Collation',
}

export const ICONE_TYPE_REPAS: Record<TypeRepas, string> = {
  petit_dejeuner: '☀️',
  dejeuner: '🍽️',
  diner: '🌙',
  collation: '🍎',
}

export const ORDRE_TYPE_REPAS: TypeRepas[] = ['petit_dejeuner', 'dejeuner', 'diner', 'collation']

export const LABEL_CONFIANCE: Record<Confiance, string> = {
  elevee: 'Confiance élevée',
  moyenne: 'Confiance moyenne',
  faible: 'Confiance faible',
}
