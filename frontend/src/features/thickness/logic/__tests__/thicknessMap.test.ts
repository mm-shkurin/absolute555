import { describe, expect, it } from 'vitest'
import type { ThicknessMapWire } from '../../../../shared/api/backend/thicknessContract'
import { toPanelDetail, toThicknessView } from '../thicknessMap'

const wire: ThicknessMapWire = {
  sale_car_id: 'l1',
  measurements: [
    { panel: 'hood', value_um: 96, status: 'factory', photo_url: 'https://s3/hood.jpg' },
    { panel: 'trunk_lid', value_um: 168, status: 'factory', photo_url: 'https://s3/trunk.jpg' },
    {
      panel: 'front_right_fender',
      value_um: 640,
      status: 'filler',
      photo_url: 'https://s3/fender.jpg',
    },
  ],
  measured_panels: 3,
  total_panels: 13,
  is_complete: false,
}

describe('карта замеров', () => {
  it('красит панель статусом сервера, а не собственным порогом', () => {
    const view = toThicknessView(wire)
    expect(view.rows.find((row) => row.code === 'hood')).toMatchObject({
      grade: 'factory',
      value: '96 мкм',
      measured: true,
    })
    expect(view.rows.find((row) => row.code === 'front_right_fender')?.grade).toBe('filler')
  })

  it('держит в списке все тринадцать панелей, включая незамеренные', () => {
    const view = toThicknessView(wire)
    expect(view.rows).toHaveLength(13)
    expect(view.measuredCount).toBe(3)
    expect(view.coverageText).toBe('3 из 13')
    expect(view.complete).toBe(false)
    const unmeasured = view.rows.find((row) => row.code === 'roof')
    expect(unmeasured).toMatchObject({ value: '—', grade: 'none', measured: false })
  })

  it('берёт полноту карты с провода, а не пересчитывает по строкам', () => {
    const full: ThicknessMapWire = { ...wire, measured_panels: 13, is_complete: true }
    const view = toThicknessView(full)
    expect(view.complete).toBe(true)
    expect(view.coverageText).toBe('13 из 13')
  })

  it('в разборе панели отдаёт число, снимок прибора и вывод', () => {
    const detail = toPanelDetail(wire, 'front_right_fender')
    expect(detail.grade).toBe('filler')
    expect(detail.valueUm).toBe(640)
    expect(detail.photoUrl).toBe('https://s3/fender.jpg')
    expect(detail.note).toBe('Значение снято с экрана прибора: шпаклёвка.')
  })

  it('о незамеренной панели говорит прямо, а не молчит', () => {
    const detail = toPanelDetail(wire, 'rear_right_door')
    expect(detail.measured).toBe(false)
    expect(detail.valueUm).toBeNull()
    expect(detail.note).toBe('Продавец не измерял эту панель.')
  })
})
