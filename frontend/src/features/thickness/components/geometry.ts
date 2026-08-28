// Геометрия схемы кузова: пять проекций, тринадцать панелей. Снято один в один с
// `ProductSpecification/ui/mockups/index.html`, экран «Карта замеров».
//
// Данными, а не разметкой: одна и та же панель встречается в трёх проекциях сразу, и
// подсветка выбранной обязана зажечься во всех трёх — по коду, а не по месту в JSX.
import type { PanelCode } from '../logic/panels'

export interface Zone {
  code: PanelCode
  d: string
}

export interface Wheel {
  cx: number
  cy: number
  r: number
}

export interface Projection {
  label: string
  labelX: number
  labelY: number
  zones: Zone[]
  outline: string[]
  wheels: Wheel[]
}

const SIDE_ZONES: Zone[] = [
  { code: 'hood', d: 'M120 134 L188 92 L194 96 L132 133 L132 140 L120 140 Z' },
  { code: 'roof', d: 'M186 90 Q194 84 206 84 L316 84 Q330 84 338 90 L332 96 L192 96 Z' },
  { code: 'trunk', d: 'M366 132 L392 133 L500 140 L500 148 L366 140 Z' },
  { code: 'fender-fl', d: 'M28 176 L28 150 Q28 138 44 136 L120 134 L120 176 Z' },
  { code: 'door-fl', d: 'M132 134 L252 134 L252 176 L132 176 Z' },
  { code: 'door-rl', d: 'M262 134 L364 134 L364 176 L262 176 Z' },
  { code: 'fender-rl', d: 'M366 142 L500 150 Q500 168 500 176 L366 176 Z' },
  { code: 'bumper-f', d: 'M22 158 L28 158 L28 178 L22 178 Z' },
  { code: 'bumper-r', d: 'M500 156 L508 158 L508 178 L500 178 Z' },
]

const SIDE_OUTLINE: string[] = [
  'M28 176 L28 150 Q28 138 44 136 L120 134 L186 90 Q194 84 206 84 L316 84 Q330 84 338 90 L392 134 L474 138 Q496 142 500 156 L500 176 Z',
  'M132 132 L192 94 L252 94 L252 132 Z M262 132 L262 94 L312 94 L364 132 Z',
  'M120 134 L120 176 M252 132 L252 176 M262 94 L262 176 M392 134 L392 176',
  'M28 176 L113 176 M167 176 L373 176 M427 176 L500 176',
]

const SIDE_WHEELS: Wheel[] = [
  { cx: 140, cy: 176, r: 27 },
  { cx: 140, cy: 176, r: 12 },
  { cx: 400, cy: 176, r: 27 },
  { cx: 400, cy: 176, r: 12 },
]

const FRONT_ZONES: Zone[] = [
  { code: 'hood', d: 'M622 96 L648 62 L802 62 L828 96 Z' },
  { code: 'bumper-f', d: 'M596 152 L854 152 L854 176 L596 176 Z' },
  { code: 'fender-fl', d: 'M596 130 L622 130 L622 152 L596 152 Z' },
  { code: 'fender-fr', d: 'M828 130 L854 130 L854 152 L828 152 Z' },
]

const FRONT_OUTLINE: string[] = [
  'M596 176 L596 120 Q596 104 616 96 L640 62 Q646 52 660 52 L790 52 Q804 52 810 62 L834 96 Q854 104 854 120 L854 176 Z',
  'M622 96 L648 62 L802 62 L828 96 Z M596 130 L854 130 M596 152 L854 152',
  'M614 176 L614 186 M836 176 L836 186',
]

const FRONT_WHEELS: Wheel[] = []

const REAR_ZONES: Zone[] = [
  { code: 'trunk', d: 'M622 312 L648 278 L802 278 L828 312 Z' },
  { code: 'bumper-r', d: 'M596 368 L854 368 L854 392 L596 392 Z' },
  { code: 'fender-rl', d: 'M596 346 L622 346 L622 368 L596 368 Z' },
  { code: 'fender-rr', d: 'M828 346 L854 346 L854 368 L828 368 Z' },
]

const REAR_OUTLINE: string[] = [
  'M596 392 L596 336 Q596 320 616 312 L640 278 Q646 268 660 268 L790 268 Q804 268 810 278 L834 312 Q854 320 854 336 L854 392 Z',
  'M622 312 L648 278 L802 278 L828 312 Z M596 346 L854 346 M596 368 L854 368',
]

const REAR_WHEELS: Wheel[] = []

const TOP_ZONES: Zone[] = [
  { code: 'hood', d: 'M126 306 L194 306 L194 454 L126 454 Z' },
  { code: 'roof', d: 'M198 314 L336 313 L336 447 L198 446 Z' },
  { code: 'trunk', d: 'M340 314 L470 320 L470 440 L340 446 Z' },
  { code: 'fender-fl', d: 'M126 290 L194 290 L194 304 L126 300 Z' },
  { code: 'fender-fr', d: 'M126 456 L194 456 L194 470 L126 466 Z' },
  { code: 'door-fl', d: 'M196 288 L266 288 L266 312 L196 312 Z' },
  { code: 'door-fr', d: 'M196 448 L266 448 L266 472 L196 472 Z' },
  { code: 'door-rl', d: 'M268 287 L338 286 L338 312 L268 312 Z' },
  { code: 'door-rr', d: 'M268 448 L338 448 L338 473 L268 473 Z' },
  { code: 'fender-rl', d: 'M340 286 L410 288 L410 312 L340 312 Z' },
  { code: 'fender-rr', d: 'M340 448 L410 448 L410 472 L340 472 Z' },
  { code: 'bumper-f', d: 'M64 340 Q64 300 100 291 L120 296 L120 464 L100 469 Q64 460 64 420 Z' },
  { code: 'bumper-r', d: 'M472 318 L494 336 L494 424 L472 442 Z' },
]

const TOP_OUTLINE: string[] = [
  'M64 380 Q64 296 130 288 L420 284 Q484 290 494 336 L494 424 Q484 470 420 476 L130 472 Q64 464 64 380 Z',
  'M194 288 L194 472 M266 288 L266 472 M338 287 L338 473 M410 288 L410 472 M126 300 L126 462',
  'M198 314 L336 313 L336 447 L198 446 Z',
]

const TOP_WHEELS: Wheel[] = []

export const PROJECTIONS: Projection[] = [
  {
    label: 'БОК ЛЕВЫЙ',
    labelX: 24,
    labelY: 28,
    zones: SIDE_ZONES,
    outline: SIDE_OUTLINE,
    wheels: SIDE_WHEELS,
  },
  {
    label: 'ПЕРЁД',
    labelX: 576,
    labelY: 28,
    zones: FRONT_ZONES,
    outline: FRONT_OUTLINE,
    wheels: FRONT_WHEELS,
  },
  {
    label: 'ЗАД',
    labelX: 576,
    labelY: 244,
    zones: REAR_ZONES,
    outline: REAR_OUTLINE,
    wheels: REAR_WHEELS,
  },
  {
    label: 'СВЕРХУ',
    labelX: 24,
    labelY: 244,
    zones: TOP_ZONES,
    outline: TOP_OUTLINE,
    wheels: TOP_WHEELS,
  },
]
