import type { AnalyseIA, ComparaisonIA } from '../types'

interface ReponseErreur {
  erreur: string
}

export async function analyserPhoto(base64: string): Promise<AnalyseIA> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ image: base64, mediaType: 'image/jpeg', mode: 'scan' }),
  })
  const data = (await res.json()) as AnalyseIA | ReponseErreur
  if (!res.ok || 'erreur' in data) {
    throw new Error('erreur' in data ? data.erreur : 'Erreur inconnue')
  }
  return data
}

export async function comparerPhotos(base64A: string, base64B: string): Promise<ComparaisonIA> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      image: base64A,
      mediaType: 'image/jpeg',
      image2: base64B,
      mediaType2: 'image/jpeg',
      mode: 'comparaison',
    }),
  })
  const data = (await res.json()) as ComparaisonIA | ReponseErreur
  if (!res.ok || 'erreur' in data) {
    throw new Error('erreur' in data ? data.erreur : 'Erreur inconnue')
  }
  return data
}

/** Recalcule les valeurs nutritionnelles d'une analyse pour une nouvelle portion (en grammes). */
export function ajusterPourPortion(analyse: AnalyseIA, nouvellePortionG: number): AnalyseIA {
  const base = analyse.portion_estimee_g || 1
  const ratio = nouvellePortionG / base
  return {
    ...analyse,
    portion_estimee_g: Math.round(nouvellePortionG),
    calories: Math.round(analyse.calories * ratio),
    proteines_g: Math.round(analyse.proteines_g * ratio * 10) / 10,
    lipides_g: Math.round(analyse.lipides_g * ratio * 10) / 10,
    lipides_satures_g: Math.round(analyse.lipides_satures_g * ratio * 10) / 10,
    glucides_g: Math.round(analyse.glucides_g * ratio * 10) / 10,
    sucres_g: Math.round(analyse.sucres_g * ratio * 10) / 10,
    fibres_g: Math.round(analyse.fibres_g * ratio * 10) / 10,
    sel_g: Math.round(analyse.sel_g * ratio * 100) / 100,
  }
}
