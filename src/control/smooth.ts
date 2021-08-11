// move body smoothly in VR mode

import { body, camera, renderer } from 'src/render'
import { delta, tick } from 'src/time'
import { Value } from 'src/value'
import { Vector3 } from 'three'

export const MIN_VELOCITY = 0.01

export const velocity = new Value(new Vector3(0, 0, -1))
export const angular = new Value(0)

export const walk = new Value()

const velta = new Vector3()

tick.on(() => {
  if (Math.abs(velocity.$.length()) > MIN_VELOCITY) {
    velta.copy(velocity.$).multiplyScalar(delta.$)

    velocity.$.sub(velta)
    body.$.position.add(
      velta.applyQuaternion(
        renderer.xr.isPresenting ? camera.quaternion : body.$.quaternion
      )
    )
  }

  body.$.position.y = renderer.xr.isPresenting ? 0 : 1.5
  if (Math.abs(angular.$) > MIN_VELOCITY) {
    const angleta = angular.$ * delta.$

    body.$.rotateY(angleta)

    angular.$ -= angleta
  }
})
