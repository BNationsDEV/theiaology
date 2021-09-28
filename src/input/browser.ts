import { Value } from 'src/value'

export const url = new Value(window.location.pathname.slice(1).split('/'))
export const hasSharedArrayBuffer = window.SharedArrayBuffer !== undefined

if (hasSharedArrayBuffer) {
  document.body.classList.add('sab')
}

export const mobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

export const options = new Value(
  new Set(window.location.search.toUpperCase().slice(1).split('|'))
)

export const isVR = new Value(false)
// @ts-ignore
navigator.xr?.isSessionSupported('immersive-vr').then(function (supported) {
  isVR.set(supported)
})

export const multiplayer = window.location.hash.slice(1)

export const isQuest = navigator.userAgent.indexOf('OculusBrowser') !== -1
