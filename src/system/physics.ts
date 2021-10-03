// performs grid traversal and collision detection
// Rbush-3d seems fast enough for now
// TODO: Trial against kd-tree, phys-x, revived gpgpu, and/or spherical
import { RBush3D } from 'rbush-3d'
import { Cage } from 'src/buffer/cage'
import { Impact } from 'src/buffer/impact'
import { Matter } from 'src/buffer/matter'
import { EPhase, Phys } from 'src/buffer/phys'
import { Size } from 'src/buffer/size'
import { SpaceTime } from 'src/buffer/spacetime'
import { Thrust } from 'src/buffer/thrust'
import { ERealmState, Universal } from 'src/buffer/universal'
import { Velocity } from 'src/buffer/velocity'
import { ATOM_COUNT } from 'src/config'
import { Box3, Vector3 } from 'three'
import { EMessage } from './enum'
import { System } from './system'

const DECAY = 0.95
const $vec3 = new Vector3()
const $vec3r = new Vector3()

class BBox extends Box3 {
  i: number
  constructor(i: number) {
    super()
    this.i = i
  }

  get minX() {
    return this.min.x
  }
  get minY() {
    return this.min.y
  }
  get minZ() {
    return this.min.z
  }
  get maxX() {
    return this.max.x
  }
  get maxY() {
    return this.max.y
  }
  get maxZ() {
    return this.max.z
  }
}

const $box = new BBox(0)

let $inserts: { [key: number]: BBox } = {}

class Physics extends System {
  past: SpaceTime
  future: SpaceTime
  matter: Matter
  thrust: Thrust
  size: Size
  impact: Impact
  universal: Universal
  cage: Cage
  velocity: Velocity
  phys: Phys

  // @ts-ignore
  tree = new RBush3D(0)
  ready = false

  slowtree = 0

  count = 0

  constructor() {
    super((1 / 5) * 1000)
  }

  onmessage(e: MessageEvent) {
    switch (undefined) {
      case this.past:
        this.past = new SpaceTime(e.data)
        break
      case this.future:
        this.future = new SpaceTime(e.data)
        break
      case this.matter:
        this.matter = new Matter(e.data)
        break
      case this.thrust:
        this.thrust = new Thrust(e.data)
        break
      case this.size:
        this.size = new Size(e.data)
        break
      case this.impact:
        this.impact = new Impact(e.data)
        break
      case this.universal:
        this.universal = new Universal(e.data)
        break
      case this.cage:
        this.cage = new Cage(e.data)

        break
      case this.velocity:
        this.velocity = new Velocity(e.data)
        break
      case this.phys:
        this.phys = new Phys(e.data)
        this.init()
        break

      default:
        switch (e.data) {
          case EMessage.FATE_UPDATE:
            $inserts = {}

            break
        }
    }
  }

  init() {
    this.ready = true
  }

  // these numbers change a bunch so better to just assign them to a tmp
  box(i: number, $bb: BBox = $box) {
    const sx = this.size.x(i) / 2,
      sy = this.size.y(i) / 2,
      sz = this.size.z(i) / 2,
      x = this.future.x(i),
      y = this.future.y(i),
      z = this.future.z(i)

    // update their sector while you have their data

    $bb.min.set(x - sx, y - sy, z - sz), $bb.max.set(x + sx, y + sy, z + sz)

    return $bb
  }

  insert(i: number) {
    if (!$inserts[i]) {
      $inserts[i] = new BBox(i)
      $inserts[i].expandByScalar(1000)
    }

    return this.box(i, $inserts[i])
  }

  tick() {
    if (!this.ready || this.universal.state() !== ERealmState.RUNNING) return
    const isInsert = this.count % 2 === 0
    this.count++
    const t = this.universal.time()

    // rip through matter, update their grid_past/futures

    const moves = new Set()
    const carries = []
    const dx = this.tickrate / 1000

    const gx = this.universal.gravityX(),
      gy = this.universal.gravityY(),
      gz = this.universal.gravityZ()

    for (let i = 0; i < ATOM_COUNT; i++) {
      const phase = this.phys.phase(i)
      const group = this.phys.core(i)
      const carried = this.phys.carried(i)

      switch (phase) {
        case EPhase.VOID:
          continue
        case EPhase.DIVINE:
          moves.add(i)
        case EPhase.STUCK: {
          isInsert && this.insert(i)

          continue
        }
        case EPhase.NORMAL:
        case EPhase.LIQUID: {
          this.insert(i)
        }
      }

      const ci = group !== 0 && i !== group ? group : i

      if (carried !== 0) {
        // set this past and future to the carrier later
        carries.push(i)
        return
      }

      let tx = this.thrust.x(ci),
        ty = this.thrust.y(ci),
        tz = this.thrust.z(ci)

      let vx = this.velocity.x(ci) + tx * dx + gx * dx,
        vy = this.velocity.y(ci) + ty * dx + gy * dx,
        vz = this.velocity.z(ci) + tz * dx + gz * dx

      if (vx !== 0 || vy !== 0 || vz !== 0) {
        moves.add(i)
        let x = this.past.x(i, this.future.x(i))
        let y = this.past.y(i, this.future.y(i))
        let z = this.past.z(i, this.future.z(i))
        this.past.time(i, t)

        x = this.future.x(i, x + vx)
        y = this.future.y(i, y + vy)
        z = this.future.z(i, z + vz)

        this.future.time(i, t + this.tickrate)

        const cX = this.cage.x(i),
          cY = this.cage.y(i),
          cZ = this.cage.z(i),
          cMX = this.cage.mX(i),
          cMY = this.cage.mY(i),
          cMZ = this.cage.mZ(i)

        const cageX = !(cX === 0 && cMX === 0),
          cageY = !(cY === 0 && cMY === 0),
          cageZ = !(cZ === 0 && cMZ === 0)

        if (cageX) {
          if (x > cMX) {
            const dx = cMX - cX > 0 ? x - cMX : 0
            this.future.x(i, cX + dx)
            this.past.x(i, cX)
          } else if (x < cX) {
            const dx = cMX - cX > 0 ? x - cX : 0
            this.future.x(i, cMX + dx)
            this.past.x(i, cMX)
          }
        }

        if (cageY) {
          if (y > cMY) {
            const dy = cMY - cY > 0 ? y - cMY : 0

            this.future.y(i, cY + dy)
            this.past.y(i, cY)
          } else if (y < cY) {
            const dy = cMY - cY > 0 ? y - cY : 0

            this.future.y(i, cMY + dy)
            this.past.y(i, cMY)
          }
        }

        if (cageZ) {
          if (z > cMZ) {
            const dz = cMZ - cZ > 0 ? z - cMZ : 0
            this.future.z(i, cZ + dz)
            this.past.z(i, cZ)
          } else if (z < cZ) {
            const dz = cMZ - cZ > 0 ? z - cZ : 0
            this.future.z(i, cMZ + dz)
            this.past.z(i, cMZ)
          }
        }
      }

      if (ci === i) {
        this.velocity.x(i, vx * DECAY)
        this.velocity.y(i, vy * DECAY)
        this.velocity.z(i, vz * DECAY)
      }
    }

    for (let carry of carries) {
      this.future.vec3(carry, this.future.vec3(this.phys.carried(carry)))
    }
    // collision phase
    isInsert && this.tree.load(Object.values($inserts))

    for (let [k, v] of Object.entries($inserts)) {
      switch (this.phys.phase(parseInt(k, 10))) {
        case EPhase.STUCK:
          continue
      }

      if (!moves.has(v.i)) continue

      let collision = false

      this.future.vec3(v.i, $vec3)
      this.velocity.vec3(v.i, $vec3v)
      this.thrust.vec3(v.i, $vec3t).negate().multiplyScalar(2)

      $vec3v.negate().multiplyScalar(2)

      this.size.vec3(v.i, $vec3s)
      const phase = this.phys.phase(v.i)
      // reset impact
      this.impact.impact(v.i, 0, -1)
      const baseCore = this.phys.core(v.i)
      for (let collide of this.tree.search(v)) {
        // richocet off collides
        if (
          collide.i === v.i ||
          (baseCore !== 0 && baseCore === this.phys.core(collide.i))
        )
          continue

        collision = true
        this.impact.impact(v.i, 0, collide.i)

        collide.getCenter($vec3o).sub($vec3)

        switch (phase) {
          case EPhase.NORMAL: {
            $vec3o
              .normalize()
              .negate()
              .add($vec3t)
              .sub($vec3v)
              .multiplyScalar(dx)

            $vec3v.add($vec3o)
            break
          }
          case EPhase.LIQUID:
            {
              $vec3o
                .normalize()
                .negate()
                .multiply(
                  $vec3r.set(
                    3 + Math.random(),
                    3 + Math.random(),
                    3 + Math.random()
                  )
                )
                .multiplyScalar(33)

              $vec3v.add($vec3o)

              // TODO: this could mess up phys groups
              if (this.phys.phase(collide.i) === EPhase.LIQUID) {
                this.velocity.addX(collide.i, $vec3v.x * 0.25)
                this.velocity.addY(collide.i, $vec3v.y * 0.25)
                this.velocity.addZ(collide.i, $vec3v.z * 0.25)
              }
            }
            break
        }
      }

      if (collision) {
        this.velocity.addX(v.i, $vec3v.x)
        this.velocity.addY(v.i, $vec3v.y)
        this.velocity.addZ(v.i, $vec3v.z)
      }
    }

    this.post(EMessage.PHYS_TICK)

    isInsert && this.tree.clear()
  }
}

new Physics()

const $vec3o = new Vector3()
const $vec3v = new Vector3()
const $vec3s = new Vector3()
const $vec3t = new Vector3()
