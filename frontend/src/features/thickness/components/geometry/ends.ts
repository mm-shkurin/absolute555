// Перёд и зад. Стороны здесь не совпадают: спереди мы смотрим машине навстречу, и её
// левый борт оказывается справа на экране; сзади — слева, как у вида сверху.
import type { Projection, Zone } from './types'

const FRONT_ZONES: Zone[] = [
  { code: 'hood', d: 'M52 372 L74 332 L166 332 L188 372 Z' },
  { code: 'front_right_fender', d: 'M34 396 L52 396 L52 424 L34 424 Z' },
  { code: 'front_left_fender', d: 'M188 396 L206 396 L206 424 L188 424 Z' },
  { code: 'front_bumper', d: 'M34 426 L206 426 L206 452 L34 452 Z' },
]

const FRONT_OUTLINE: string[] = [
  'M34 456 L34 390 Q34 376 52 370 L74 332 Q80 322 92 322 L148 322 Q160 322 166 332 L188 370 Q206 376 206 390 L206 456 Z',
  'M52 370 L74 332 L166 332 L188 370 M34 396 L206 396 M34 424 L206 424',
  'M46 456 L46 466 M194 456 L194 466',
]

const REAR_ZONES: Zone[] = [
  { code: 'trunk_lid', d: 'M832 372 L854 332 L946 332 L968 372 Z' },
  { code: 'rear_left_fender', d: 'M814 396 L832 396 L832 424 L814 424 Z' },
  { code: 'rear_right_fender', d: 'M968 396 L986 396 L986 424 L968 424 Z' },
  { code: 'rear_bumper', d: 'M814 426 L986 426 L986 452 L814 452 Z' },
]

const REAR_OUTLINE: string[] = [
  'M814 456 L814 390 Q814 376 832 370 L854 332 Q860 322 872 322 L928 322 Q940 322 946 332 L968 370 Q986 376 986 390 L986 456 Z',
  'M832 370 L854 332 L946 332 L968 370 M814 396 L986 396 M814 424 L986 424',
  'M826 456 L826 466 M974 456 L974 466',
]

export const FRONT: Projection = {
  label: 'ПЕРЁД',
  labelX: 30,
  labelY: 288,
  zones: FRONT_ZONES,
  outline: FRONT_OUTLINE,
  wheels: [],
}

export const REAR: Projection = {
  label: 'ЗАД',
  labelX: 810,
  labelY: 288,
  zones: REAR_ZONES,
  outline: REAR_OUTLINE,
  wheels: [],
}
