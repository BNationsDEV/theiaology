import { Animation } from 'src/buffer/animation'
import { Impact } from 'src/buffer/impact'
import { Matter } from 'src/buffer/matter'
import { Scale } from 'src/buffer/scale'
import { SpaceTime } from 'src/buffer/spacetime'
import { EStatus, Status } from 'src/buffer/status'
import { Timeline } from 'src/buffer/timeline'
import { Velocity } from 'src/buffer/velocity'
import { voxes } from 'src/buffer/vox'
import { ENTITY_COUNT } from 'src/config'
import { ECardinalMessage } from './message'
import { System } from './system'

// Deal out entity IDs, execute timeline events
class Cardinal extends System {
  IDS = [...new Array(ENTITY_COUNT)].map((i) => i)
  ticks = 0
  // entity components
  past: SpaceTime
  future: SpaceTime
  matter: Matter
  velocity: Velocity
  scale: Scale
  impact: Impact
  animation: Animation
  status: Status

  // world components
  timeline: Timeline

  constructor() {
    super(200)
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
      case this.scale:
        this.scale = new Scale(e.data)
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

      // expecting IMessage but no atomics
      default:
        switch (typeof e.data) {
          case 'object':
            // this is voxes data
            voxes.set(e.data)
            return
          case 'number':
            switch (e.data) {
              case ECardinalMessage.RequestID:
                break
              case ECardinalMessage.TimelineUpdated:
                this.timelineUpdated()
                break
              case ECardinalMessage.FreeAll:
                this.freeAll()
                break
            }
            return
        }
    }
  }

  timelineUpdated() {
    this.freeAll()

    // run through timeline and execute rezes
  }

  freeAll() {
    for (let i = 0; i < ENTITY_COUNT; i++) {
      this.free(i)
    }
    this.IDS = [...new Array(ENTITY_COUNT)].map((i) => i)
  }

  free(i: number) {
    this.animation.free(i)
    this.future.free(i, SpaceTime.COUNT)
    this.past.free(i, SpaceTime.COUNT)
    this.velocity.free(i, Velocity.COUNT)
    this.matter.free(i, Matter.COUNT)
    this.impact.free(i, Impact.COUNT)
    this.scale.free(i, Velocity.COUNT)
    this.status.free(i)
  }

  available(i: number) {
    this.free(i)
    this.IDS.push(i)
  }

  reserve() {
    const i = this.IDS.pop()
    this.free(i)

    this.status.store(i, EStatus.Assigned)
    return i
  }

  tick() {
    this.randomize()
  }
  randomize() {
    const scale = 80000
    const t = Math.floor(performance.now())

    const chunk = (this.tickrate / 1000) * ENTITY_COUNT * 0.1
    // lets prove out thhese even render
    for (let ix = last; ix < last + chunk; ix++) {
      const i = ix % ENTITY_COUNT
      this.past.x(i, this.future.x(i))
      this.past.y(i, this.future.y(i))
      this.past.z(i, this.future.z(i))
      this.past.time(i, t + 100)

      this.future.x(i, Math.floor(Math.random() * scale - scale / 2))
      this.future.y(i, Math.floor((Math.random() * scale) / 2))
      this.future.z(i, Math.floor(Math.random() * scale - scale / 2))
      this.future.time(i, t + 10000 + 100)

      this.matter.blue(i, Math.floor(Math.random() * 0x22))
      this.matter.red(i, Math.floor(Math.random() * 0x22))
      this.matter.green(i, Math.floor(Math.random() * 0x22))
    }

    last += chunk
  }
}

let last = 0

new Cardinal()
