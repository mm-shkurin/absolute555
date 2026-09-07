// Вид сверху: нос слева, левый борт машины у верхнего края. Центральная полоса — капот,
// стёкла, крыша и багажник; боковые — крылья и двери.
import type { Projection, Zone } from './types'

const ZONES: Zone[] = [
  {
    code: 'front_bumper',
    d: 'M250 410 Q250 330 302 312 L318 316 L318 504 L302 508 Q250 490 250 410 Z',
  },
  { code: 'front_left_fender', d: 'M318 306 L390 306 L390 338 L318 338 Z' },
  { code: 'front_right_fender', d: 'M318 514 L390 514 L390 482 L318 482 Z' },
  { code: 'hood', d: 'M320 338 L440 338 L440 482 L320 482 Z' },
  { code: 'front_left_door', d: 'M392 303 L500 302 L500 338 L392 338 Z' },
  { code: 'front_right_door', d: 'M392 517 L500 518 L500 482 L392 482 Z' },
  { code: 'rear_left_door', d: 'M502 302 L608 302 L608 338 L502 338 Z' },
  { code: 'rear_right_door', d: 'M502 518 L608 518 L608 482 L502 482 Z' },
  { code: 'rear_left_fender', d: 'M610 302 L732 306 L732 338 L610 338 Z' },
  { code: 'rear_right_fender', d: 'M610 518 L732 514 L732 482 L610 482 Z' },
  { code: 'roof', d: 'M472 338 L578 338 L578 482 L472 482 Z' },
  { code: 'trunk_lid', d: 'M612 338 L732 338 L732 482 L612 482 Z' },
  { code: 'rear_bumper', d: 'M734 310 L760 332 L760 488 L734 510 Z' },
]

const OUTLINE: string[] = [
  'M250 410 Q250 322 320 304 L700 300 Q752 306 762 340 L762 480 Q752 514 700 520 L320 516 Q250 498 250 410 Z',
  'M318 306 L318 514 M390 305 L390 515 M500 302 L500 518 M608 302 L608 518 M732 306 L732 514',
  'M338 305 L338 515 M482 305 L482 515',
  'M442 338 L470 338 L470 482 L442 482 Z M580 338 L610 338 L610 482 L580 482 Z',
]

export const TOP: Projection = {
  label: 'СВЕРХУ',
  labelX: 246,
  labelY: 288,
  zones: ZONES,
  outline: OUTLINE,
  wheels: [],
}
