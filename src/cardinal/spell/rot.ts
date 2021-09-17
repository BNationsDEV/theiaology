import { ESpell } from 'src/fate/weave'
import { ICardinal } from 'src/system/enum'
import { ERipple, Spell } from '../spell'

export default {
  [ESpell.ROT](i: number, $c: ICardinal, $spell: Spell) {
    $spell.rot.set($c.fate.data0(i), $c.fate.data1(i), $c.fate.data2(i))
    $spell.ripple(ERipple.ROT, $spell.rot)
  },
  [ESpell.ROT_LOOK](i: number, $c: ICardinal, $spell: Spell) {
    $spell.doLook = true
    $spell.look.set($c.fate.data0(i), $c.fate.data1(i), $c.fate.data2(i))
    $spell.ripple(ERipple.DOLOOK, $spell.doLook)
    $spell.ripple(ERipple.LOOK, $spell.look)
  },
  [ESpell.ROT_VAR](i: number, $c: ICardinal, $spell: Spell) {
    $spell.rotvar.set($c.fate.data0(i), $c.fate.data1(i), $c.fate.data2(i))
    $spell.ripple(ERipple.ROTVAR, $spell.rotvar)
  },
}
