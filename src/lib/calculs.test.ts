import { describe, it, expect } from 'vitest'
import {
  calculerIMC,
  categorieIMC,
  calculerMetabolismeBase,
  calculerTDEE,
  calculerObjectifCalorique,
  DEFICIT_MAX_KCAL,
  PLANCHER_KCAL,
} from './calculs'

describe('calculerIMC', () => {
  it('calcule un IMC correct', () => {
    expect(calculerIMC(70, 175)).toBeCloseTo(22.86, 1)
  })
  it('catégorise correctement', () => {
    expect(categorieIMC(17)).toBe('Insuffisance pondérale')
    expect(categorieIMC(22)).toBe('Corpulence normale')
    expect(categorieIMC(27)).toBe('Surpoids')
    expect(categorieIMC(32)).toBe('Obésité')
  })
})

describe('calculerMetabolismeBase (Mifflin-St Jeor)', () => {
  it('femme', () => {
    expect(calculerMetabolismeBase('femme', 65, 165, 30)).toBeCloseTo(1370.25, 1)
  })
  it('homme', () => {
    expect(calculerMetabolismeBase('homme', 80, 180, 30)).toBeCloseTo(1780, 1)
  })
})

describe('calculerTDEE', () => {
  it('applique le facteur sédentaire', () => {
    expect(calculerTDEE(1500, 'sedentaire')).toBeCloseTo(1800, 1)
  })
})

describe('garde-fous caloriques', () => {
  it('ne descend jamais sous le plancher femme', () => {
    const r = calculerObjectifCalorique(1400, 0.75, 'femme', 55, 165)
    expect(r.objectifKcal).toBeGreaterThanOrEqual(PLANCHER_KCAL.femme)
    expect(r.deficitReduit).toBe(true)
  })

  it('ne descend jamais sous le plancher homme', () => {
    const r = calculerObjectifCalorique(1600, 0.75, 'homme', 70, 175)
    expect(r.objectifKcal).toBeGreaterThanOrEqual(PLANCHER_KCAL.homme)
  })

  it('plafonne le déficit à 750 kcal/jour', () => {
    const r = calculerObjectifCalorique(4000, 0.75, 'homme', 80, 180)
    expect(r.deficitApplique).toBeLessThanOrEqual(DEFICIT_MAX_KCAL)
  })

  it('signale un IMC objectif trop bas et ne propose pas de déficit', () => {
    const r = calculerObjectifCalorique(1800, 0.5, 'femme', 45, 170)
    expect(r.imcObjectifTropBas).toBe(true)
    expect(r.deficitApplique).toBe(0)
  })
})
