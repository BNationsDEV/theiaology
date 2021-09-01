import { Value } from 'src/value/value'
import { Uniform } from 'three'

export const tick = new Value(0)
export const delta = new Value(0)
export const runtime = new Value(0)

export function Loop($t) {
  delta.set(($t - runtime.$) / 1000)
  runtime.set($t)

  tick.set(tick.$ + 1)
}

export const timeUniform = new Uniform(0.0)
runtime.on(($t) => {
  timeUniform.value = Math.floor(performance.now())
})
