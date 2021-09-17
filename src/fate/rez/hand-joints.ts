import { EAnimation } from 'src/buffer/animation'
import { EPhase } from 'src/buffer/matter'
import { NORMALIZER } from 'src/config'
import { doPose } from 'src/controller/hands'
import { isVR } from 'src/input/browser'
import { vr_keys } from 'src/input/joints'
import { hands, left_hand_uniforms, right_hand_uniforms } from 'src/input/xr'
import { first } from 'src/realm'
import { body } from 'src/render'
import { timing } from 'src/shader/time'
import { EMessage } from 'src/system/enum'
import { SystemWorker } from 'src/system/sys'
import { Vector3 } from 'three'
import './phony'

let hand_joints: number[] = []
const $vec = new Vector3()

// Rezes allow us to inject into the worker simulation from the main thread
export function RezHands(cardinal: SystemWorker) {
  hand_joints = []

  // request the hands
  // vr_keys is an enum and therefore 2x the length, which is what we want
  // for two hands anyhow
  for (let i = 0; i < Object.keys(vr_keys).length; i++) {
    cardinal.send(EMessage.REZ)
    cardinal.waitForEntity((id) => {
      hand_joints.push(id)
    })
  }
}

const rTip = /tip$/
const rMeta = /metacarpal$|proximal$/

// update hand rezes if they exist
timing.on(() => {
  // no hands, nothing to do

  if (hands.$.length === 0) return

  for (let i = 0; i < hand_joints.length; i++) {
    const ix = i % 25
    const iy = Math.floor(i / 25)
    const id = hand_joints[i]

    const j = hands.$[iy]?.joints[vr_keys[ix]]

    if (!j) continue

    if (ix === 0) {
      doPose(hands.$[iy])
    }

    $vec
      .copy(j.position)
      .applyQuaternion(body.$.quaternion)
      .add(body.$.position)
      .multiplyScalar(2)

    if (rTip.test(vr_keys[ix])) {
      let target
      // copy hand pos to the uniforms
      switch (hands.$[iy].handedness) {
        case 'left':
          target = left_hand_uniforms
          break
        case 'right':
          target = right_hand_uniforms
      }

      target[vr_keys[ix]].value.copy($vec)
    }

    const s = Math.floor(rMeta.test(vr_keys[ix]) ? 8 : 5) * 9.5

    const { size, future, matter, past, animation: animation } = first.$
    animation.store(id, EAnimation.OFF)
    size.x(id, s)
    size.y(id, s)
    size.z(id, s)

    matter.phase(id, EPhase.STUCK)
    matter.blue(id, NORMALIZER - (Math.random() * NORMALIZER) / 1000)

    if (!isVR.$) {
      $vec.y -= 1
    }
    $vec.multiplyScalar(1000)
    future.x(id, Math.floor($vec.x))
    future.y(id, Math.floor($vec.y))
    future.z(id, Math.floor($vec.z))

    past.x(id, future.x(id))
    past.y(id, future.y(id))
    past.z(id, future.z(id))
    past.time(id, Math.floor(timing.$))
    future.time(id, Math.floor(timing.$ + 200))
  }
})

let cancel
first.on(($r) => {
  if (cancel) cancel()
  cancel = $r.fate.on(() => {
    // Rez the player hands

    if (!$r.cardinal) return

    setTimeout(() => {
      RezHands($r.cardinal)
    }, 1000)
  })
})