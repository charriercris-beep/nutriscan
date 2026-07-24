import { describe, it, expect } from 'vitest'
import { agregerParJour, serieJoursDansObjectif } from './planning'
import type { Repas } from '../types'

function repas(date: string, calories: number): Repas {
  return {
    date,
    type: 'dejeuner',
    nom: 'test',
    portionG: 100,
    calories,
    proteinesG: 0,
    lipidesG: 0,
    lipidesSaturesG: 0,
    glucidesG: 0,
    sucresG: 0,
    fibresG: 0,
    selG: 0,
    confiance: 'moyenne',
    modifieManuellement: false,
    creeLe: 0,
  }
}

describe('agregerParJour', () => {
  it('additionne les calories par jour', () => {
    const r = [repas('2026-07-20', 500), repas('2026-07-20', 300), repas('2026-07-21', 200)]
    const totaux = agregerParJour(r, ['2026-07-20', '2026-07-21', '2026-07-22'])
    expect(totaux[0].calories).toBe(800)
    expect(totaux[1].calories).toBe(200)
    expect(totaux[2].calories).toBe(0)
  })
})

describe('serieJoursDansObjectif', () => {
  it("compte la série de jours consécutifs dans l'objectif depuis le plus récent", () => {
    const totaux = [
      { date: '2026-07-18', calories: 2200, proteinesG: 0, lipidesG: 0, glucidesG: 0 },
      { date: '2026-07-19', calories: 1900, proteinesG: 0, lipidesG: 0, glucidesG: 0 },
      { date: '2026-07-20', calories: 1800, proteinesG: 0, lipidesG: 0, glucidesG: 0 },
    ]
    expect(serieJoursDansObjectif(totaux, 2000)).toBe(2)
  })

  it('renvoie 0 si le jour le plus récent est un jour sans repas', () => {
    const totaux = [{ date: '2026-07-20', calories: 0, proteinesG: 0, lipidesG: 0, glucidesG: 0 }]
    expect(serieJoursDansObjectif(totaux, 2000)).toBe(0)
  })
})
