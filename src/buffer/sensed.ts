import { ATOM_COUNT } from 'src/config'
import { AtomicInt } from './atomic'

export enum SENSES {
  NONE = 0,
  SIGHT = 0xf,
  HEAR = 0xf0,
  FEEL_RIGHT = 0xf00,
  FEEL_LEFT = 0xf000,
  FELT = 0xf0000,
  TASTE = 0xf00000,
}

export class Sensed extends AtomicInt {
  static COUNT = 2

  constructor(buffer = new SharedArrayBuffer(ATOM_COUNT * Sensed.COUNT)) {
    super(buffer)
  }

  id(i: number, id?: number): number {
    return id === undefined
      ? Atomics.load(this, Sensed.COUNT * i)
      : Atomics.store(this, Sensed.COUNT * i, id)
  }

  sense(i: number, sense?: number): number {
    return sense === undefined
      ? Atomics.load(this, Sensed.COUNT * i + 1)
      : Atomics.store(this, Sensed.COUNT * i + 1, sense)
  }
}