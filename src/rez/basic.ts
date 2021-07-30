import { lowerAvg } from 'src/audio'
import { meshes, SIZE } from 'src/rez'
import { timestamp } from 'src/time'
import { Color, Matrix4 } from 'three'

export interface IBoxRez {
  where: Matrix4
  size: number
  size2: number
  halfsize: number
}

// like a turtle going outwards
export function BoxRez(atom: Matrix4, i: number, opts: IBoxRez): Matrix4 {
  // how large is the box?
  const z = Math.floor(i / opts.size2)

  return atom
    .identity()
    .makeTranslation(
      (i % opts.size) * SIZE - opts.halfsize,
      Math.floor((i - z * opts.size2) / opts.size) * SIZE - opts.halfsize,
      z * SIZE - opts.halfsize
    )
    .multiply(opts.where)
}

export class PlaneOptions {
  where: Matrix4
  size: number
  size2: number
  halfsize: number
  scale: number
  scalesize: number
  halfscalesize: number
  z?: boolean
  color: Color

  constructor(
    size: number,
    z?: boolean,
    scale = 3,
    color = new Color(0x00aa00)
  ) {
    this.color = color
    this.size = size
    this.size2 = size * size
    this.halfsize = size / 2
    this.z = z

    this.where = new Matrix4().identity().makeScale(scale, scale, scale)
    this.scale = scale

    this.scalesize = scale * SIZE
    this.halfscalesize = this.scalesize / 2
  }
}

const $color = new Color()

export function PlaneRez(
  atom: Matrix4,
  i: number,
  opts: PlaneOptions,
  idx: number
): Matrix4 {
  const x =
    opts.scalesize * ((i % opts.size) - opts.halfsize) - opts.halfscalesize
  const y =
    opts.scalesize * (opts.z ? 0 : Math.floor(i / opts.size) - opts.halfsize) -
    opts.halfscalesize
  const z =
    opts.scalesize * (opts.z ? Math.floor(i / opts.size - opts.halfsize) : 0) -
    opts.halfscalesize

  const variance = Math.sin(timestamp.$ * 0.001 + z * x * y * 100) * 0.3
  meshes.$.setColorAt(
    idx,
    $color.copy(opts.color).multiplyScalar(0.8 + variance)
  )

  return atom
    .identity()
    .makeTranslation(
      x,
      y +
        variance * 0.5 +
        Math.cos(x * z + timestamp.$ * 0.00001 * lowerAvg.$) * 0.02,
      z
    )
    .multiply(opts.where)
}
