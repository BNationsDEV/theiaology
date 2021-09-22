import 'src/$team'
import 'src/controller/audio'
import 'src/controller/player'
import 'src/fate/rez/hand-joints'
// @ts-ignore - tots is a module
import Theiaology from 'src/fate/Theiaology.svelte'
import 'src/input/file'
import * as render from 'src/render'

// startup editor
const theiaology = new Theiaology({
  target: document.getElementById('theiaology'),
  props: {},
})

// register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service.js', { scope: '/' })
}

Object.assign(window, { render })
