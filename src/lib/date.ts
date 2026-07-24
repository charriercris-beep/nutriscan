// Utilitaires de date au format 'YYYY-MM-DD' (fuseau local)

export function aujourdhui(): string {
  return formatDate(new Date())
}

export function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Lundi de la semaine contenant la date donnée */
export function debutSemaine(dateStr: string): Date {
  const d = parseDate(dateStr)
  const jour = d.getDay() // 0 = dimanche
  const decalage = jour === 0 ? -6 : 1 - jour
  d.setDate(d.getDate() + decalage)
  d.setHours(0, 0, 0, 0)
  return d
}

export function joursDeLaSemaine(dateStr: string): string[] {
  const lundi = debutSemaine(dateStr)
  const jours: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(lundi)
    d.setDate(lundi.getDate() + i)
    jours.push(formatDate(d))
  }
  return jours
}

export function ajouterJours(dateStr: string, n: number): string {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + n)
  return formatDate(d)
}

export const NOMS_JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export function libelleJour(dateStr: string): string {
  const d = parseDate(dateStr)
  const idx = (d.getDay() + 6) % 7
  return `${NOMS_JOURS[idx]} ${d.getDate()}`
}

export function repasPreselectionne(): 'petit_dejeuner' | 'dejeuner' | 'diner' | 'collation' {
  const h = new Date().getHours()
  if (h < 10) return 'petit_dejeuner'
  if (h < 15) return 'dejeuner'
  if (h < 19) return 'collation'
  return 'diner'
}
