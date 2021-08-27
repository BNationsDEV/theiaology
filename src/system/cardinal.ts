import { Animation } from 'src/buffer/animation'
import { Impact } from 'src/buffer/impact'
import { Matter } from 'src/buffer/matter'
import { Size } from 'src/buffer/size'
import { SpaceTime } from 'src/buffer/spacetime'
import { EStatus, Status } from 'src/buffer/status'
import { Timeline } from 'src/buffer/timeline'
import { Universal } from 'src/buffer/universal'
import { Velocity } from 'src/buffer/velocity'
import { voxes } from 'src/buffer/vox'
import { ENTITY_COUNT, NORMALIZER } from 'src/config'
import { ShapeMap } from 'src/shape'
import { ALPHABET } from 'src/shape/text'
import { EAxis, EIdle, ETimeline, Rez } from 'src/timeline/def-timeline'
import { Color, Euler, Object3D, Vector3 } from 'three'
import { EMessage, FRez } from './sys-enum'
import { System } from './system'

const $hsl = { h: 0, s: 0, l: 0 }
const $col = new Color()
const $col2 = new Color()
const $eule = new Euler()
const $o3d = new Object3D()
const $vec3 = new Vector3()
const $vec3_o = new Vector3()

// Deal out entity IDs, execute timeline events
class Cardinal extends System {
  _available: number[] = [...new Array(ENTITY_COUNT)].map((_, i) => i)

  // entity components
  past: SpaceTime
  future: SpaceTime
  matter: Matter
  velocity: Velocity
  size: Size
  impact: Impact
  animation: Animation
  status: Status

  timeline: Timeline
  universal: Universal
  // world components
  defines: { [key: number]: number[] } = []
  rezes: { [def: number]: Rez } = {}

  // do a command at timing
  timing: { [time: number]: number[] } = {}
  ready = false

  lastTime = 0

  constructor() {
    // Music Timing works off seconds
    super(500)
  }

  // receives buffers then IDs to free
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
      case this.velocity:
        this.velocity = new Velocity(e.data)
        break
      case this.size:
        this.size = new Size(e.data)
        break
      case this.animation:
        this.animation = new Animation(e.data)
        break
      case this.impact:
        this.impact = new Impact(e.data)
        break

      case this.status:
        this.status = new Status(e.data)
        break

      case this.timeline:
        this.timeline = new Timeline(e.data)
        break

      case this.universal:
        this.universal = new Universal(e.data)
        this.ready = true
        break

      // expecting IMessage but no atomics
      default:
        switch (typeof e.data) {
          case 'object':
            // this is voxes data
            voxes.set(e.data)

            // update the timeline
            this.timelineUpdated()
            return

          case 'number':
            switch (e.data) {
              case EMessage.REZ:
                this.post(this.reserve())
                break

              case EMessage.FREE_ALL:
                this.freeAll()
                break

              case EMessage.TIMELINE_UPDATE:
                this.timelineUpdated()

                break
            }
            return
        }
    }
  }

  define(def: number) {
    this.rezes[def] = this.rezes[def] || new Rez()

    const $rez = this.rezes[def]

    const timing = this.universal.musicTime()

    const define = this.defines[def]
    if (define === undefined) {
      throw new Error('invalid define number for flat timelinemap')
    }
    for (let child of define) {
      // Check the timing to only apply the right stuff
      if (this.timeline.when(child) > timing) continue

      switch (this.timeline.command(child)) {
        case ETimeline.TEXT:
          $rez.text = this.timeline.text(child)
          break
        case ETimeline.SIZEVAR:
          $rez.sizevar.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break
        case ETimeline.ROTVAR:
          $rez.rotvar.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break
        case ETimeline.ROT:
          $rez.rot.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break
        case ETimeline.LOOK:
          $rez.doLook = true
          $rez.look.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )

          break
        case ETimeline.VOXVAR:
          $rez.voxvar.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break
        case ETimeline.VOX:
          $rez.vox = this.timeline.text(child)
          break
        case ETimeline.FLOCK:
          $rez.flock.shape = this.timeline.data0(child)
          $rez.flock.size = this.timeline.data1(child)
          $rez.flock.step = this.timeline.data2(child)
          break
        case ETimeline.SIZE:
          $rez.size.x = this.timeline.data0(child)
          $rez.size.y = this.timeline.data1(child)
          $rez.size.z = this.timeline.data2(child)
          break
        case ETimeline.COLOR:
          const rgb = this.timeline.data0(child)
          $rez.color.setHex(rgb)
          $rez.col.tilt = this.timeline.data1(child)
          $rez.col.variance = this.timeline.data2(child)

          break
        case ETimeline.POSVAR:
          $rez.posvar.x = this.timeline.data0(child)
          $rez.posvar.y = this.timeline.data1(child)
          $rez.posvar.z = this.timeline.data2(child)
          break
        case ETimeline.POS:
          $rez.pos.x = this.timeline.data0(child)
          $rez.pos.y = this.timeline.data1(child)
          $rez.pos.z = this.timeline.data2(child)
          break
        case ETimeline.THRUST:
          $rez.vel.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break
        case ETimeline.THRUSTVAR:
          $rez.velvar.set(
            this.timeline.data0(child),
            this.timeline.data1(child),
            this.timeline.data2(child)
          )
          break

        // TODO: useful for bullets and such
        case ETimeline.THRUSTTO:
          break
        case ETimeline.PHASE:
          $rez.phase = this.timeline.data0(child)
          break
        case ETimeline.IMPACT:
          $rez.impact = this.timeline.data0(child)
          break
      }
    }
    return $rez
  }

  // Entity ID number to init
  entity(def: number) {
    // navigate up the tree to root
    // build for loops to apply

    const t = this.universal.time()
    const $rez = this.define(def)

    // now we rez
    // determine voxel count, for loop over them
    const shape = ShapeMap[$rez.flock.shape]
    if (!shape) {
      throw new Error("couldn't find shape on shapemap" + $rez.flock.shape)
    }

    const atoms = shape.AtomCount($rez.flock.size, $rez.flock.step)
    for (let i = 0; i < atoms; i++) {
      const $shape = shape(i, $rez.flock.size, $rez.flock.step)

      // apply $rez data

      const x =
        $rez.pos.x +
        $shape.x +
        Math.round($rez.posvar.x * Math.random() * 2 - $rez.posvar.x)
      const y =
        $rez.pos.y +
        $shape.y +
        Math.round($rez.posvar.y * Math.random() * 2 - $rez.posvar.y)

      const z =
        $rez.pos.z +
        $shape.z +
        Math.round($rez.posvar.z * Math.random() * 2 - $rez.posvar.z)

      $col
        .setRGB(Math.random(), Math.random(), Math.random())
        .lerp($rez.color, (NORMALIZER - $rez.col.variance) / NORMALIZER)

      // tilt
      $col.getHSL($hsl)

      $col.setHSL($hsl.h + $rez.col.tilt / NORMALIZER, $hsl.s, $hsl.l)

      const sx = $rez.size.x + Math.round(Math.random() * $rez.sizevar.x)
      const sy = $rez.size.y + Math.round(Math.random() * $rez.sizevar.y)
      const sz = $rez.size.z + Math.round(Math.random() * $rez.sizevar.z)

      switch (true) {
        // is voxel rez
        case $rez.vox !== '' && voxes.$[$rez.vox] !== undefined:
          // Need to clean this part up
          this.vox($rez, $hsl, t, x, y, z, sx, sy, sz)
          continue
        // is text rez
        case $rez.text !== undefined:
          this.text($rez, $hsl, t, x, y, z, sx, sy, sz, $col)
          continue
        default:
          this.basic($rez, $hsl, t, x, y, z, sx, sy, sz)
      }
    }
  }

  text($rez, $hsl, t, x, y, z, sx, sy, sz, color) {
    for (let i = 0; i < $rez.text.length; i++) {
      const map = ALPHABET[$rez.text.charAt(i).toLowerCase()]
      if (!map) continue

      for (let v of map) {
        const id = this.reserve()
        $rez.rezes.push(id)

        if (v[2] === undefined) {
          v[2] = v[0]
        }
        if (v[3] === undefined) {
          v[3] = v[1]
        }
        const smx = v[2] - v[0]
        const smy = v[3] - v[1]

        this.future.time(id, t + 1000 * Math.random() + 500)
        this.future.x(id, x + v[0] * sx + (sx * smx) / 2)
        this.future.y(id, y + v[1] * sy + (sy * smy) / 2)
        this.future.z(id, z)

        this.size.x(id, sx + sx * smx)
        this.size.y(id, sy + sy * smy)
        this.size.z(id, sz + Math.random() * 0.5)
        color
          .setRGB(Math.random(), Math.random(), Math.random())
          .lerp($rez.color, (NORMALIZER - $rez.col.variance) / NORMALIZER)
        this.matter.red(id, Math.floor(color.r * NORMALIZER))
        this.matter.green(id, Math.floor(color.g * NORMALIZER))
        this.matter.blue(id, Math.floor(color.b * NORMALIZER))

        this.matter.phase(id, $rez.phase)
        this.impact.reaction(id, $rez.impact)
        this.velocity.x(id, $rez.vel.x)
        this.velocity.y(id, $rez.vel.y)
        this.velocity.z(id, $rez.vel.z)
      }

      x += sx * 5
    }
  }

  basic($rez, $hsl, t, x, y, z, sx, sy, sz) {
    const id = this.reserve()
    $rez.rezes.push(id)

    this.future.time(id, t + 1000 * Math.random() + 500)
    this.future.x(id, x)
    this.future.y(id, y)
    this.future.z(id, z)

    this.size.x(id, sx)
    this.size.y(id, sy)
    this.size.z(id, sz)
    this.velocity.x(id, $rez.vel.x + Math.floor(Math.random() * $rez.velvar.x))
    this.velocity.y(id, $rez.vel.y + Math.floor(Math.random() * $rez.velvar.y))
    this.velocity.z(id, $rez.vel.z + Math.floor(Math.random() * $rez.velvar.z))
    this.core(id, $col, $rez)
  }

  vox($rez, $hsl, t, x, y, z, sx, sy, sz) {
    // vox miss, but could be because we haven't loaded $voxes yet
    const voxDef = voxes.$[$rez.vox]
    const ts = $hsl.s
    const tl = $hsl.l

    const variance = ($rez.col.variance / NORMALIZER) * Math.random()
    let rx = ($rez.rotvar.x / NORMALIZER) * Math.random() * Math.PI * 2
    let ry = ($rez.rotvar.y / NORMALIZER) * Math.random() * Math.PI * 2
    let rz = ($rez.rotvar.z / NORMALIZER) * Math.random() * Math.PI * 2

    if ($rez.doLook) {
      $o3d.position.set(x, $rez.look.y, z)
      $o3d.lookAt($rez.look)
      $eule.setFromQuaternion($o3d.quaternion)

      $eule.y += ($rez.rot.y / NORMALIZER) * Math.PI * 2
      $eule.z += ($rez.rot.z / NORMALIZER) * Math.PI * 2
      $eule.x += ($rez.rot.x / NORMALIZER) * Math.PI * 2
    } else {
      $eule.set(
        rx + ($rez.rot.x / NORMALIZER) * Math.PI * 2,
        ry + ($rez.rot.y / NORMALIZER) * Math.PI * 2,
        rz + ($rez.rot.z / NORMALIZER) * Math.PI * 2
      )
    }
    const rtx = Math.random() * $rez.velvar.x
    const rty = Math.random() * $rez.velvar.y
    const rtz = Math.random() * $rez.velvar.z
    for (let i = 0; i < voxDef.xyzi.length / 4; i++) {
      const id = this.reserve()
      $rez.rezes.push(id)
      const ix = i * 4

      $vec3
        .set(
          voxDef.xyzi[ix] * sx,
          voxDef.xyzi[ix + 2] * sy,
          voxDef.xyzi[ix + 1] * sz
        )

        .applyEuler($eule)
        .add($vec3_o.set(x, y, z))

      this.future.time(id, t + 1000 * Math.random() + 500)
      this.future.x(id, $vec3.x + Math.round(Math.random() * 2 - 1))
      this.future.y(id, $vec3.y + Math.round(Math.random() * 2 - 1))
      this.future.z(id, $vec3.z + Math.round(Math.random() * 2 - 1))

      // -1 because magica?
      const c = (voxDef.xyzi[ix + 3] - 1) * 4

      const r = voxDef.rgba[c]
      const g = voxDef.rgba[c + 1]
      const b = voxDef.rgba[c + 2]
      $col2.setRGB(r / 255, g / 255, b / 255).getHSL($hsl)

      let addTilt = 0
      if ($rez.voxvar.x === r * 256 * 256 + g * 256 + b) {
        addTilt = Math.random() * $rez.voxvar.z + $rez.voxvar.y
      }

      $col2.setHSL(
        ($hsl.h +
          $rez.col.tilt / NORMALIZER +
          addTilt +
          variance +
          Math.random() * 0.05) %
          1,
        ($hsl.s + ts) / 2,
        ($hsl.l + tl) / 2
      )

      this.size.x(id, sx)
      this.size.y(id, sy)
      this.size.z(id, sz)
      this.velocity.x(id, $rez.vel.x + rtx)
      this.velocity.y(id, $rez.vel.y + rty)
      this.velocity.z(id, $rez.vel.z + rtz)
      this.core(id, $col2, $rez)
    }
  }

  core(id: number, color: Color, $rez: Rez) {
    this.matter.red(id, Math.floor(color.r * NORMALIZER))
    this.matter.green(id, Math.floor(color.g * NORMALIZER))
    this.matter.blue(id, Math.floor(color.b * NORMALIZER))

    this.matter.phase(id, $rez.phase)
    this.impact.reaction(id, $rez.impact)
  }

  process() {
    const toRez = []
    const timing = this.universal.musicTime()
    this.lastTime = timing
    // run through timeline and execute rezes
    for (let i = 0; i < this.timeline.length / Timeline.COUNT; i++) {
      const t = this.timeline.when(i)
      if (t > timing) {
        this.timing[t] = this.timing[t] || []
        this.timing[t].push(t)
        continue
      }
      const who = this.timeline.who(i)

      if (!this.defines[who]) {
        this.defines[who] = []
      }

      this.defines[who].push(i)

      switch (this.timeline.command(i)) {
        case ETimeline.USERROT:
          this.universal.userRX(this.timeline.data0(i))
          this.universal.userRY(this.timeline.data1(i))
          this.universal.userRZ(this.timeline.data2(i))
          this.post(EMessage.USER_ROT_UPDATE)
          break
        case ETimeline.USERPOS:
          this.universal.userX(this.timeline.data0(i))
          this.universal.userY(this.timeline.data1(i))
          this.universal.userZ(this.timeline.data2(i))
          this.post(EMessage.USER_POS_UPDATE)
          break
        case ETimeline.CLEARCOLOR:
          this.universal.clearColor(this.timeline.data0(i))
          this.post(EMessage.CLEAR_COLOR_UPDATE)
          break
        case ETimeline.IDLE:
          this.universal.idle(this.timeline.data0(i))
          break
        case ETimeline.CAGE:
          const min = this.timeline.data1(i)
          const max = this.timeline.data2(i)
          switch (this.timeline.data0(i)) {
            case EAxis.XYZ:
              this.universal.minZ(min)
              this.universal.maxZ(max)
            // fallthrough
            case EAxis.XY:
              this.universal.minY(min)
              this.universal.maxY(max)
              this.universal.minX(min)
              this.universal.maxX(max)
              break
            case EAxis.XZ:
              this.universal.minX(min)
              this.universal.maxX(max)
              this.universal.minZ(min)
              this.universal.maxZ(max)
              break
            case EAxis.YZ:
              this.universal.minY(min)
              this.universal.maxY(max)
              this.universal.minZ(min)
              this.universal.maxZ(max)
              break
            case EAxis.X:
              this.universal.minX(min)
              this.universal.maxX(max)
              break
            case EAxis.Y:
              this.universal.minY(min)
              this.universal.maxY(max)
              break
            case EAxis.Z:
              this.universal.minZ(min)
              this.universal.maxZ(max)
              break
          }

          this.post(EMessage.CAGE_UPDATE)

          break
        // rez time
        case ETimeline.REZ:
          toRez.push(i)
          break
      }
    }

    for (let rez of toRez) {
      for (let c = 0; c < this.timeline.data0(rez); c++) {
        this.entity(this.timeline.who(rez))
      }
    }
  }

  timelineUpdated() {
    this.freeAll()
    // clear it
    this.defines = []
    this.timing = {}
    this.rezes = {}

    this.universal.reset()
    this.post(EMessage.CAGE_UPDATE)
    this.post(EMessage.CLEAR_COLOR_UPDATE)

    this.process()

    this.post(EMessage.TIMELINE_UPDATE)
  }

  freeAll() {
    for (let i = 0; i < ENTITY_COUNT; i++) {
      this.free(i)
    }
    this._available = [...new Array(ENTITY_COUNT)].map((_, i) => i)
  }

  free(i: number) {
    this.animation.free(i)
    this.future.free(i, SpaceTime.COUNT)
    this.past.free(i, SpaceTime.COUNT)
    this.velocity.free(i, Velocity.COUNT)
    this.matter.free(i, Matter.COUNT)
    this.impact.free(i, Impact.COUNT)
    this.size.free(i, Velocity.COUNT)
    this.status.free(i)
  }

  available(i: number) {
    this.free(i)
    this._available.push(i)
  }

  // execute a command from the timeline
  execute(i: number) {
    switch (this.timeline.command(i)) {
      case ETimeline.REZ:
      case ETimeline.THRUST:
        // run through rezes and update their thrust
        console.log('hit')
    }
  }

  reserve: FRez = () => {
    const i = this._available.pop()
    this.free(i)

    this.status.store(i, EStatus.Assigned)
    return i
  }

  tick() {
    if (this.ready) {
      const t = this.universal.musicTime()
      if (t !== this.lastTime) {
        this.lastTime = t
        if (this.timing[t]) {
          for (let comm of this.timing[t]) {
            this.execute(comm)
          }
        }
      }

      switch (this.universal.idle()) {
        case EIdle.Randomize:
          this.randomize()
          break
      }
    }
  }

  randomize() {
    // TODO: Use cage bounds
    const scale = 18000
    const t = this.universal.time()

    const chunk = 1000
    // lets prove out thhese even render
    for (let ix = last; ix < last + chunk; ix++) {
      // only use left overs
      const i = this._available[ix % this._available.length]
      this.past.x(i, this.future.x(i))
      this.past.y(i, this.future.y(i))
      this.past.z(i, this.future.z(i))
      this.past.time(i, t)

      this.future.x(i, Math.floor(Math.random() * scale - scale / 2))
      this.future.y(i, Math.floor(Math.random() * scale - scale / 2))
      this.future.z(i, Math.floor(Math.random() * scale - scale / 2))
      this.future.time(i, t + 30000 + 100)

      const s = 5

      this.size.x(i, s)
      this.size.y(i, s)
      this.size.z(i, s)

      this.matter.blue(i, NORMALIZER)
      this.matter.red(i, Math.floor(Math.random() * NORMALIZER))
      this.matter.green(i, Math.floor(Math.random() * NORMALIZER))
    }

    last += chunk
  }
}

let last = 0

new Cardinal()
