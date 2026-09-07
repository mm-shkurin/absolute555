// Схема врёт молча: панель без зоны просто не подсвечивается, и заметить это можно
// только глазами на одном из тринадцати кликов. Отсюда проверки на полноту.
import { describe, expect, it } from 'vitest'
import { PANELS } from '../../../logic/panels'
import { PROJECTIONS } from '../index'
import { mirrorCode } from '../types'
import { LEFT_SIDE, RIGHT_SIDE } from '../sides'

const codesOf = (label: string) =>
  PROJECTIONS.find((projection) => projection.label === label)!.zones.map((zone) => zone.code)

describe('геометрия схемы кузова', () => {
  it('обходит машину пятью проекциями', () => {
    expect(PROJECTIONS.map((projection) => projection.label)).toEqual([
      'БОРТ ЛЕВЫЙ',
      'ПЕРЕД',
      'СВЕРХУ',
      'ЗАД',
      'БОРТ ПРАВЫЙ',
    ])
  })

  it('показывает каждую из тринадцати панелей хотя бы в одной проекции', () => {
    const drawn = new Set(PROJECTIONS.flatMap((projection) => projection.zones).map((z) => z.code))
    expect([...drawn].toSorted()).toEqual(PANELS.map((panel) => panel.code).toSorted())
  })

  it('не рисует зон, которых нет в наборе панелей', () => {
    const known = new Set<string>(PANELS.map((panel) => panel.code))
    const unknown = PROJECTIONS.flatMap((p) => p.zones).filter((zone) => !known.has(zone.code))
    expect(unknown).toEqual([])
  })

  it('даёт правому борту правые панели, а не копию левых', () => {
    expect(codesOf('БОРТ ПРАВЫЙ')).toEqual(LEFT_SIDE.zones.map((zone) => mirrorCode(zone.code)))
    expect(codesOf('БОРТ ПРАВЫЙ')).toContain('front_right_door')
    expect(codesOf('БОРТ ПРАВЫЙ')).not.toContain('front_left_door')
  })

  it('отражает правый борт преобразованием, а не второй копией путей', () => {
    expect(RIGHT_SIDE.transform).toBeTruthy()
    expect(RIGHT_SIDE.outline).toBe(LEFT_SIDE.outline)
  })

  it('оставляет капот, крышу и бамперы без стороны', () => {
    expect(mirrorCode('hood')).toBe('hood')
    expect(mirrorCode('roof')).toBe('roof')
    expect(mirrorCode('front_bumper')).toBe('front_bumper')
  })

  it('держит каждую дверь на своём борту, а не только на виде сверху', () => {
    expect(codesOf('БОРТ ЛЕВЫЙ')).toContain('rear_left_door')
    expect(codesOf('БОРТ ПРАВЫЙ')).toContain('rear_right_door')
  })
})
