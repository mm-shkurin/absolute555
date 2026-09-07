// Борт седана в профиль: нос слева, порог на y=222, крыша на y=96. Правый борт — тот же
// обвод, отражённый по вертикальной оси и опущенный ниже вида сверху.
import type { Projection, Zone } from './types'
import { mirrorCode } from './types'

const ZONES: Zone[] = [
  {
    code: 'front_bumper',
    d: 'M246 184 Q246 174 258 171 L262 171 L262 218 L250 215 Q246 202 246 192 Z',
  },
  { code: 'hood', d: 'M264 168 L372 156 L424 156 L424 166 L372 166 L264 178 Z' },
  { code: 'roof', d: 'M456 102 Q462 96 472 96 L588 96 Q599 96 605 103 L596 108 L466 108 Z' },
  { code: 'trunk_lid', d: 'M650 148 L744 152 Q754 154 758 160 L652 158 Z' },
  { code: 'front_left_fender', d: 'M262 172 Q262 168 274 167 L392 160 L392 222 L262 222 Z' },
  { code: 'front_left_door', d: 'M394 160 L500 160 L500 222 L394 222 Z' },
  { code: 'rear_left_door', d: 'M502 160 L608 160 L608 222 L502 222 Z' },
  { code: 'rear_left_fender', d: 'M610 160 L748 160 Q766 164 770 180 L770 222 L610 222 Z' },
  { code: 'rear_bumper', d: 'M770 180 L782 184 L782 214 L770 218 Z' },
]

const OUTLINE: string[] = [
  'M250 218 Q246 200 246 186 Q246 174 260 170 L274 167 L372 156 L424 156 L456 102 Q462 96 472 96 L588 96 Q599 96 605 103 L650 150 L748 158 Q768 164 772 182 L772 218 Z',
  'M428 156 L462 110 L520 110 L520 156 Z M530 110 L586 110 L600 112 L640 154 L530 154 Z',
  'M392 158 L392 222 M500 156 L500 222 M502 110 L502 222 M608 158 L608 222 M262 170 L262 222 M650 150 L650 222',
  'M250 222 L300 222 M372 222 L640 222 M712 222 L772 222',
]

const WHEELS = [
  { cx: 336, cy: 222, r: 36 },
  { cx: 336, cy: 222, r: 16 },
  { cx: 676, cy: 222, r: 36 },
  { cx: 676, cy: 222, r: 16 },
]

export const LEFT_SIDE: Projection = {
  label: 'БОРТ ЛЕВЫЙ',
  labelX: 246,
  labelY: 60,
  zones: ZONES,
  outline: OUTLINE,
  wheels: WHEELS,
}

export const RIGHT_SIDE: Projection = {
  label: 'БОРТ ПРАВЫЙ',
  labelX: 246,
  labelY: 548,
  zones: ZONES.map((zone) => ({ code: mirrorCode(zone.code), d: zone.d })),
  outline: OUTLINE,
  wheels: WHEELS,
  transform: 'translate(0,480) scale(-1,1) translate(-1028,0)',
}
