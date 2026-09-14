import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { BodySchematic } from '../BodySchematic'
import { toThicknessView } from '../thicknessMap'
import type { ThicknessMapWire } from '../../api/backend/thicknessContract'

// Форма `GET /sale-cars/{id}/thickness`: сервер присылает только замеренные панели.
const wire = {
  sale_car_id: 'car1',
  measurements: [
    { panel: 'front_right_fender', value_um: 320, status: 'repaint', source: 'ocr', ocr_value_um: null, photo_url: null },
    { panel: 'hood', value_um: 110, status: 'factory', source: 'ocr', ocr_value_um: null, photo_url: null },
  ],
  measured_panels: 2,
  total_panels: 13,
  is_complete: false,
} as unknown as ThicknessMapWire

function drawn(selected: string | null = null, onSelect = vi.fn()) {
  const { rows } = toThicknessView(wire)
  const { container } = render(
    <BodySchematic rows={rows} selected={selected as never} onSelect={onSelect} />,
  )
  const zones = (code: string) => [...container.querySelectorAll(`[data-panel="${code}"]`)]
  return { zones, onSelect }
}

// Feature: Карта окрасов кузова
describe('схема кузова', () => {
  it('Scenario: перекрашенное правое крыло окрашено цветом перекраса во всех проекциях', () => {
    // Given продавец замерил правое переднее крыло: 320 мкм, перекрашено
    // When покупатель открывает карту
    const { zones } = drawn()
    // Then каждое вхождение крыла на схеме — цвета перекраса
    expect(zones('front_right_fender').length).toBeGreaterThan(0)
    expect(zones('front_right_fender').map((zone) => zone.getAttribute('fill'))).toEqual(
      zones('front_right_fender').map(() => 'var(--measure-warn)'),
    )
  })

  it('Scenario: незамеренная панель видна как «не замерено», а не заводская', () => {
    const { zones } = drawn()

    expect(zones('rear_left_door')[0].getAttribute('fill')).toBe('var(--measure-none)')
  })

  it('Scenario: клик по крылу на правом борту выбирает это крыло', () => {
    const { zones, onSelect } = drawn()

    fireEvent.click(zones('front_right_fender').at(-1)!)

    expect(onSelect).toHaveBeenCalledWith('front_right_fender')
  })

  it('выбранная панель подсвечена во всех своих вхождениях', () => {
    const { zones } = drawn('hood')

    expect(zones('hood').map((zone) => zone.getAttribute('data-selected'))).toEqual(
      zones('hood').map(() => 'true'),
    )
  })

  it('легенда подписывает цвета числами порогов сервера', () => {
    const { container } = render(<BodySchematic rows={[]} selected={null} onSelect={vi.fn()} />)

    expect(container.textContent).toContain('перекрашено 200–499')
    expect(container.textContent).toContain('шпаклёвка от 500')
  })
})
