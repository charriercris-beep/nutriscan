// Fonction serverless Vercel : proxy vers l'API Anthropic (vision).
// La clé ANTHROPIC_API_KEY reste côté serveur, jamais exposée au client.

export const config = { runtime: 'nodejs' }

interface RequeteAnalyse {
  image: string // base64 sans préfixe
  mediaType?: string
  image2?: string
  mediaType2?: string
  mode?: 'scan' | 'comparaison'
}

const PROMPT_SCAN = `Tu es un nutritionniste expert en estimation visuelle de portions.
Analyse la photo du plat fournie et réponds UNIQUEMENT par un objet JSON valide,
sans texte avant ou après, sans balises markdown.

Schéma exact :
{
  "plat": "nom court du plat en français",
  "description": "1 phrase décrivant ce que tu vois",
  "portion_estimee_g": nombre,
  "aliments_detectes": [{"nom": string, "quantite_g": nombre, "calories": nombre}],
  "calories": nombre,
  "proteines_g": nombre,
  "lipides_g": nombre,
  "lipides_satures_g": nombre,
  "glucides_g": nombre,
  "sucres_g": nombre,
  "fibres_g": nombre,
  "sel_g": nombre,
  "confiance": "elevee" | "moyenne" | "faible",
  "remarque": "conseil ou réserve en 1 phrase, ou chaîne vide"
}

Règles :
- Estime la portion à partir des repères visuels (assiette ~26cm, couverts, verre).
- Si plusieurs aliments, additionne-les dans les totaux.
- Si l'image ne contient pas de nourriture, renvoie
  {"erreur": "aucun aliment détecté"}.
- Les valeurs numériques sont des nombres, jamais des chaînes.`

const PROMPT_COMPARAISON = `Tu es un nutritionniste expert en estimation visuelle de portions.
Analyse les deux photos fournies (Option A puis Option B — chacune peut être un plat
ou une carte/étiquette de menu) et réponds UNIQUEMENT par un objet JSON valide,
sans texte avant ou après, sans balises markdown.

Schéma exact :
{
  "options": [
    {
      "plat": "nom court du plat en français",
      "description": "1 phrase décrivant ce que tu vois",
      "portion_estimee_g": nombre,
      "aliments_detectes": [{"nom": string, "quantite_g": nombre, "calories": nombre}],
      "calories": nombre,
      "proteines_g": nombre,
      "lipides_g": nombre,
      "lipides_satures_g": nombre,
      "glucides_g": nombre,
      "sucres_g": nombre,
      "fibres_g": nombre,
      "sel_g": nombre,
      "confiance": "elevee" | "moyenne" | "faible",
      "remarque": "conseil ou réserve en 1 phrase, ou chaîne vide"
    },
    { "...même schéma pour l'option B" : true }
  ],
  "comparaison": {
    "recommandee": "A" | "B",
    "ecart_kcal": nombre,
    "justification": "2 phrases expliquant le choix"
  }
}

Règles :
- Estime la portion à partir des repères visuels (assiette ~26cm, couverts, verre).
- Si plusieurs aliments, additionne-les dans les totaux de chaque option.
- Si une image ne contient ni plat ni menu lisible, indique une confiance "faible"
  et une remarque expliquant la limite, mais ne bloque pas la réponse globale.
- Les valeurs numériques sont des nombres, jamais des chaînes.`

function extraireJson(texte: string): unknown {
  let nettoye = texte.trim()
  nettoye = nettoye.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '')
  return JSON.parse(nettoye)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ erreur: 'Méthode non autorisée' }), { status: 405 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ erreur: "Clé API non configurée côté serveur" }), { status: 500 })
  }

  let body: RequeteAnalyse
  try {
    body = (await req.json()) as RequeteAnalyse
  } catch {
    return new Response(JSON.stringify({ erreur: 'Requête invalide' }), { status: 400 })
  }

  if (!body.image) {
    return new Response(JSON.stringify({ erreur: 'Image manquante' }), { status: 400 })
  }

  const estComparaison = body.mode === 'comparaison' && !!body.image2
  const prompt = estComparaison ? PROMPT_COMPARAISON : PROMPT_SCAN

  const content: Record<string, unknown>[] = [
    { type: 'image', source: { type: 'base64', media_type: body.mediaType || 'image/jpeg', data: body.image } },
  ]
  if (estComparaison && body.image2) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: body.mediaType2 || 'image/jpeg', data: body.image2 },
    })
  }
  content.push({ type: 'text', text: prompt })

  try {
    const reponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!reponse.ok) {
      const texteErreur = await reponse.text()
      return new Response(JSON.stringify({ erreur: `Erreur API (${reponse.status})`, detail: texteErreur }), {
        status: 502,
      })
    }

    const data = await reponse.json()
    const texte: string = data?.content?.[0]?.text ?? ''

    try {
      const parsed = extraireJson(texte)
      return new Response(JSON.stringify(parsed), { status: 200, headers: { 'content-type': 'application/json' } })
    } catch {
      return new Response(
        JSON.stringify({ erreur: "Réponse de l'IA illisible, réessaie avec une photo plus nette." }),
        { status: 502 },
      )
    }
  } catch {
    return new Response(JSON.stringify({ erreur: 'Impossible de contacter le service d\'analyse.' }), { status: 502 })
  }
}
