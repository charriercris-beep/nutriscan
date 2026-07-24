import Dexie, { type Table } from 'dexie'
import type { Profil, Repas, Pesee } from '../types'

export class NutriScanDB extends Dexie {
  profil!: Table<Profil, number>
  repas!: Table<Repas, number>
  pesees!: Table<Pesee, number>

  constructor() {
    super('nutriscan')
    this.version(1).stores({
      profil: 'id',
      repas: '++id, date, type',
      pesees: '++id, date',
    })
  }
}

export const db = new NutriScanDB()
