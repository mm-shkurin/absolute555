// Пример объявления, разобранный на плитки героя. Это витрина, а не данные из API:
// цифры подобраны так, чтобы шкала замеров была видна во всех четырёх состояниях.
export interface PanelMark {
  state: 'ok' | 'warn' | 'bad' | 'none'
}

export const HERO_LISTING = {
  title: 'Toyota Camry, 2019 · 96 400 км',
  price: '1 390 000 ₽',
  place: 'Объявление · Омск',
  badge: 'Карта замеров полная',
}

export const HERO_MEASURE = {
  panel: 'Замер · капот',
  value: '128 мкм',
  caption: 'заводская краска',
}

// Одиннадцать панелей кузова в том же порядке, что на карте замеров.
export const HERO_PANELS: PanelMark[] = [
  { state: 'ok' },
  { state: 'ok' },
  { state: 'ok' },
  { state: 'warn' },
  { state: 'ok' },
  { state: 'ok' },
  { state: 'bad' },
  { state: 'ok' },
  { state: 'ok' },
  { state: 'ok' },
  { state: 'none' },
]

// VIN в публичной карточке маскируется: полный номер — личные данные владельца.
export const HERO_VIN = { head: 'XW8ZZ', hidden: '••••••••', tail: '2345' }

export const HERO_SPEC = '2.5 · 181 л.с. · автомат — подставлено распознаванием'

export const HERO_SELLER = {
  stars: '★★★★★',
  title: '4,8 · 12 закрытых сделок',
  note: 'Отзыв оставляют только после принятого предложения.',
}
