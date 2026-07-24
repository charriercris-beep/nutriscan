import { describe, it, expect } from 'vitest'
import { ajusterPourPortion } from './analyseApi'
import type { AnalyseIA } from '../types'

const base: AnalyseIA = {
  plat: 'Poulet riz',
  description: 'Un plat de poulet et riz',
  portion_estimee_g: 300,
  aliments_detectes: [],
  calories: 500,
  proteines_g: 40,
  lipides_g: 15,
  lipides_satures_g: 5,
  glucides_g: 50,
  sucres_g: 5,
  fibres_g: 4,
  sel_g: 1.2,
  confiance: 'moyenne',
  remarque: '',
}

describe('ajusterPourPortion', () => {
  it('double toutes les valeurs pour une portion doublée', () => {
    const r = ajusterPourPortion(base, 600)
    expect(r.calories).toBe(1000)
    expect(r.proteines_g).toBe(80)
    expect(r.portion_estimee_g).toBe(600)
  })

  it('divise par deux pour une demi-portion', () => {
    const r = ajusterPourPortion(base, 150)
    expect(r.calories).toBe(250)
    expect(r.sel_g).toBe(0.6)
  })

  it('laisse inchangé si la portion est identique', () => {
    const r = ajusterPourPortion(base, 300)
    expect(r.calories).toBe(500)
    expect(r.fibres_g).toBe(4)
  })
})
