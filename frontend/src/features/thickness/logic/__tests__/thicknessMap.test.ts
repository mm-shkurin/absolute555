import { describe, expect, it } from 'vitest'
import { gradeOf } from '../panels'
import { toPanelDetail, toThicknessView } from '../thicknessMap'
import type { ThicknessMapWire } from '../../api/thicknessApi'

const wire: ThicknessMapWire = {
  listing_id: 'l1',
  listing_title: 'Lexus LX 570',
  factory_micrometers: 100,
  panels: [
    { panel: 'hood', micrometers: 96, photo_url: null, manually_corrected: false },
    { panel: 'trunk', micrometers: 168, photo_url: null, manually_corrected: false },
    { panel: 'fender-fr', micrometers: 640, photo_url: null, manually_corrected: true },
  ],
}

describe('карта замеров', () => {
  it('делит замер по порогам шкалы', () => {
    expect(gradeOf(150)).toBe('ok')
    expect(gradeOf(151)).toBe('warn')
    expect(gradeOf(300)).toBe('warn')
    expect(gradeOf(301)).toBe('bad')
    expect(gradeOf(null)).toBe('none')
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

  it('помечает правку продавца и называет заводскую толщину', () => {
    const detail = toPanelDetail(wire, 'fender-fr')
    expect(detail.grade).toBe('bad')
    expect(detail.manuallyCorrected).toBe(true)
    expect(detail.note).toBe(
      'Число уточнено продавцом вручную после распознавания. Заводская толщина у этой модели — около 100 мкм.',
    )
  })

  it('о незамеренной панели говорит прямо, а не молчит', () => {
    expect(toPanelDetail(wire, 'roof').note).toBe('Продавец не измерял эту панель.')
  })
})
