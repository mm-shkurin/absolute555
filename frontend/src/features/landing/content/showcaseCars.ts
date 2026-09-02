// Витрина ленты на лендинге. Восемь машин-примеров: реальные карточки приедут из API,
// здесь важно, чтобы шкала замеров показала все состояния, включая полностью не мереный
// кузов у машин под заказ — у них нет ни VIN, ни СТС, ни доступа к панелям.
export type Mark = 'ok' | 'warn' | 'bad' | 'none'

export interface ShowcaseCar {
  name: string
  price: string
  meta: string
  tag?: 'full' | 'import'
  panels: Mark[]
}

const O: Mark = 'ok'
const W: Mark = 'warn'
const B: Mark = 'bad'
const N: Mark = 'none'
const UNMEASURED: Mark[] = Array.from({ length: 11 }, () => N)

export const SHOWCASE_CARS: ShowcaseCar[] = [
  {
    name: 'Toyota Camry, 2019',
    price: '1 390 000 ₽',
    meta: '96 400 км · автомат · 2.5',
    tag: 'full',
    panels: [O, O, O, W, O, O, B, O, O, O, O],
  },
  {
    name: 'Nissan X-Trail, 2017',
    price: '2 140 000 ₽',
    meta: '128 000 км · вариатор · 2.0',
    tag: 'full',
    panels: [O, O, O, O, O, O, O, W, O, O, O],
  },
  {
    name: 'Hyundai Solaris, 2020',
    price: '780 000 ₽',
    meta: '54 300 км · механика · 1.6',
    panels: [O, O, W, N, N, O, N, O, N, N, N],
  },
  {
    name: 'Toyota RAV4, 2022',
    price: '3 250 000 ₽',
    meta: 'Япония · под ключ · 45 дней',
    tag: 'import',
    panels: UNMEASURED,
  },
  {
    name: 'Kia Rio, 2018',
    price: '890 000 ₽',
    meta: '88 100 км · автомат · 1.6',
    tag: 'full',
    panels: [O, W, W, O, O, O, O, O, O, O, O],
  },
  {
    name: 'Lada Vesta, 2021',
    price: '1 050 000 ₽',
    meta: '37 900 км · механика · 1.6',
    panels: [O, O, N, N, O, N, N, N, N, N, N],
  },
  {
    name: 'Mazda CX-5, 2016',
    price: '1 780 000 ₽',
    meta: '142 000 км · автомат · 2.0',
    tag: 'full',
    panels: [O, B, W, W, O, O, O, O, W, O, O],
  },
  {
    name: 'Volkswagen Tiguan, 2021',
    price: '2 980 000 ₽',
    meta: 'Корея · под ключ · 60 дней',
    tag: 'import',
    panels: UNMEASURED,
  },
]

export const TAG_LABEL: Record<'full' | 'import', string> = {
  full: 'полная карта',
  import: 'под заказ',
}
