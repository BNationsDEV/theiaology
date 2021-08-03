import { left_hand_uniform, right_hand_uniform } from 'src/input/xr'
import { MeshToonMaterial } from 'three'
import { lowerUniform, upperUniform } from '../audio/audio'
import { timeUniform } from '../time'
import AnimationFrag from './animation.frag'
import AnimationVert from './animation.vert'
import postVertChunk from './chunkPost.vert'
import EnumVert from './enum.vert'
import HeaderVert from './header.vert'
import SpaceTime from './spacetime.vert'

export const material = new MeshToonMaterial({ color: 0xffffff })

const commonVertChunk = [
  '#include <common>',
  HeaderVert,
  EnumVert,
  AnimationVert,
  SpaceTime,
].join('\n')

const fragmentParsChunk = ['#include <common>', EnumVert, AnimationFrag].join(
  '\n'
)

const colorChunk = [
  `vec4 diffuseColor = AnimationFrag(vec4( diffuse, opacity));`,
].join('\n')

material.onBeforeCompile = function (shader) {
  shader.uniforms.time = timeUniform
  shader.uniforms.audioLow = lowerUniform
  shader.uniforms.audioHigh = upperUniform
  shader.uniforms.handLeft = left_hand_uniform
  shader.uniforms.handRight = right_hand_uniform

  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', commonVertChunk)
    .replace('#include <project_vertex>', postVertChunk)

  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', fragmentParsChunk)
    .replace('vec4 diffuseColor = vec4( diffuse, opacity );', colorChunk)
}