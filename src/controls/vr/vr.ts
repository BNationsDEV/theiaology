import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
import { audio } from '../../audio/audio'
import { renderer, scene } from '../../render'
import { HandRez } from '../../rez/hand'
import { doRez, Rez } from '../../rez/rez'
import { Value } from '../../store'
import { IJointGroup } from './interface'
import { poses, poseValue } from './poses'
import * as Spells from './spells'
import {
  hand_controllers,
  last_pose,
  left_hand,
  pose,
  right_hand,
} from './store'

renderer.$.xr.enabled = true

export const MIN_POSE_VALUE = 0.1
export type PoseValues = number[][]

export const button = VRButton.createButton(renderer.$)
document.body.appendChild(button)

export const onVRClick = new Value(false)
export const VRInit = new Value(false)

button.addEventListener('click', () => {
  onVRClick.is(true)

  if (VRInit.$) return

  for (let i = 0; i < 2; i++) {
    const hand = renderer.$.xr.getHand(i) as any

    if (!hand) continue

    scene.$.add(hand)

    hand.addEventListener('connected', (e) => {
      hand.handedness = e.data.handedness
      switch (hand.handedness) {
        case 'left':
          left_hand.is(hand)
          break
        case 'right':
          right_hand.is(hand)
          break
      }
    })

    hand_controllers.$.push(hand)

    hand_controllers.poke()
  }

  audio.play()

  VRInit.is(true)
})

// return the variance from the two posts
function comparePose(p1: PoseValues, p2: PoseValues): number {
  return p1.reduce(
    (sum, arr, j) =>
      arr.reduce((s_sum, v, i) => {
        return s_sum + Math.abs(v - p2[j][i])
      }, sum),
    0
  )
}

pose.on((v) => requestAnimationFrame(() => last_pose.is(v)))

function doPose(hand: IJointGroup) {
  const handPoseValue = poseValue(hand)
  let winner
  let valueToBeat = MIN_POSE_VALUE

  // calc hand pose deltas
  Object.entries(poses[hand.handedness]).forEach(([key, value]) => {
    const res = comparePose(value, handPoseValue)
    if (res > valueToBeat) {
      return
    }
    winner = key
    valueToBeat = res
  })

  const lastPose = pose.$[hand.handedness]
  if (winner && winner !== lastPose) {
    pose.$[hand.handedness] = winner
    pose.poke()

    if (Spells[winner]) {
      Spells[winner](hand)
    }

    const k = `Un${lastPose}`
    if (Spells[k]) {
      Spells[k](hand)
    }
  } else if (winner === undefined && lastPose) {
    pose.$[hand.handedness] = ''

    const k = `Un${lastPose}`
    if (Spells[k]) {
      Spells[k](hand)
    }
  }
}

doRez.on(() => {
  for (let i = 0; i < hand_controllers.$.length; i++) {
    const count = Object.keys(hand_controllers.$[i].joints).length
    if (count === 0) continue

    doPose(hand_controllers.$[i])
    // also triggers joint_update for each joint
    Rez(HandRez, count, hand_controllers.$[i])
  }
})
