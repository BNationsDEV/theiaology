import { first } from 'src/realm/realm'
import { ESpell } from 'src/timeline/def-timeline'
import { cursor } from 'src/timeline/nav'
import { Value } from 'src/value/value'

export const clipped = new Value(0)
export const clip = new Value([0, 0, 0, 0, 0, 0])

export function Copy() {
  const { timeline } = first.$
  if (cursor.$.i === undefined) return

  clip.$[0] = timeline.$.when(cursor.$.i)
  clip.$[1] = timeline.$.invoke(cursor.$.i)
  clip.$[2] = timeline.$.who(cursor.$.i)
  clip.$[3] = timeline.$.data0(cursor.$.i)
  clip.$[4] = timeline.$.data1(cursor.$.i)
  clip.$[5] = timeline.$.data2(cursor.$.i)
  clipped.set(cursor.$.i)
  clip.poke()
}

function SubItem(i: number, parent: number) {
  const { timeline, timelineJSON } = first.$
  const item = timelineJSON.$.flat[i]

  const id = timeline.$.add(
    timeline.$.when(i),
    timeline.$.invoke(i),
    parent,
    timeline.$.data0(i),
    timeline.$.data1(i),
    timeline.$.data2(i)
  )

  for (let c of Object.keys(item._)) {
    SubItem(parseInt(c, 10), id)
  }
}

export function Paste() {
  const { timeline, timelineJSON } = first.$
  if (cursor.$.i === undefined) return
  // get data from cursor
  clip.$[2] =
    timeline.$.invoke(cursor.$.i) === ESpell.TOME
      ? cursor.$.i
      : timeline.$.who(cursor.$.i)
  // @ts-ignore
  const id = timeline.$.add(...clip.$)

  const item = timelineJSON.$.flat[clipped.$]
  for (let c of Object.keys(item._)) {
    SubItem(parseInt(c, 10), id)
  }
  timeline.poke()
}

export function Cut() {
  const { timeline } = first.$
  if (cursor.$.i === undefined) return
  Copy()

  timeline.$.free(cursor.$.i)
  timeline.poke()
}
