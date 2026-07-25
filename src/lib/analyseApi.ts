import type { AnalyseIA, ComparaisonIA } from '../types'

interface ReponseErreur {
  erreur: string
}

const DELAI_MAX_MS = 45000

async function appelerAnalyse(payload: Record<string, unknown>): Promise<unknown> {
  const controleur = new AbortController()
  const minuteur = setTimeout(() => controleur.abort(), DELAI_MAX_MS)

  let res: Response
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controleur.signal,
    })
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error("L'analyse a pris trop de temps (plus de 45 s). Réessaie avec une photo plus légère ou une meilleure connexion.")
    }
    throw new Error('Impossible de contacter le service d\'analyse. Vérifie ta connexion.')
  } finally {
    clearTimeout(minuteur)
  }

  let data: unknown
  try {
    data = await res.json()
  } catch {
    throw new Error(`Réponse inattendue du serveur (code ${res.status}). Réessaie dans quelques instants.`)
  }

  if (!res.ok || (typeof data === 'object' && data !== null && 'erreur' in data)) {
    const message = typeof data === 'object' && data !== null && 'erreur' in data ? (data as ReponseErreur).erreur : `Erreur inconnue (code ${res.status})`
    throw new Error(message)
  }

  return data
}

export async function analyserPhoto(base64: string): Promise<AnalyseIA> {
  return (await appelerAnalyse({ image: base64, mediaType: 'image/jpeg', mode: 'scan' })) as AnalyseIA
}

export async function comparerPhotos(base64A: string, base64B: string): Promise<ComparaisonIA> {
  return (await appelerAnalyse({
    image: base64A,
    mediaType: 'image/jpeg',
    image2: base64B,
    mediaType2: 'image/jpeg',
    mode: 'comparaison',
  })) as ComparaisonIA
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
