// Экран ленты. Данные карточек — те же, что в HTML-мокапе: макет, показывающий другие
// машины, невозможно сверить с прототипом глазами.

const CARS = [
  {
    title: 'Toyota Camry',
    year: 2019,
    price: '2 340 000 ₽',
    specs: '86 000 км · 181 л.с. · АКПП',
    city: 'Омск',
    vin: 'VIN проверен',
    badge: { label: 'полная карта замеров', tone: 'measure/ok' },
  },
  {
    title: 'Lexus LX 570',
    year: 2012,
    price: '4 020 000 ₽',
    specs: '180 000 км · 367 л.с. · АКПП',
    city: 'Омск',
    vin: 'VIN проверен',
    badge: { label: 'полная карта замеров', tone: 'measure/ok' },
  },
  {
    title: 'Honda Stream',
    year: 2010,
    price: '1 020 000 ₽',
    specs: '194 000 км · 140 л.с. · АКПП',
    city: 'Омск',
    vin: 'VIN проверен',
  },
  {
    title: 'Toyota Alphard',
    year: 2021,
    price: '6 100 000 ₽',
    specs: 'доставка 55–70 дней · Вариатор',
    city: 'Япония',
    vin: 'без VIN',
    badge: { label: 'под заказ', tone: 'accent/base' },
  },
  {
    title: 'Kia Rio',
    year: 2018,
    price: '980 000 ₽',
    specs: '74 000 км · 123 л.с. · АКПП',
    city: 'Калачинск',
    vin: 'VIN проверен',
  },
  {
    title: 'Mazda CX-5',
    year: 2016,
    price: '1 890 000 ₽',
    specs: '128 000 км · 150 л.с. · АКПП',
    city: 'Омск',
    vin: 'VIN проверен',
    badge: { label: 'полная карта замеров', tone: 'measure/ok' },
  },
]

function filtersPanel() {
  const filters = panel('Фильтры', { width: 236, gap: 14 })

  filters.appendChild(text('МАРКА И МОДЕЛЬ', 'Моно/Ярлык', 'text/muted'))
  const brand = stack('Поле марки', {
    horizontal: true,
    padLeft: 10,
    padRight: 10,
    padTop: 9,
    padBottom: 9,
    radius: RADIUS.control,
    justify: 'SPACE_BETWEEN',
    align: 'CENTER',
    bg: 'bg/surface',
    border: 'border/subtle',
  })
  put(filters, brand, 'fill')
  brand.appendChild(text('Выберите марку', 'Текст/Вторичный', 'text/muted'))
  brand.appendChild(text('›', 'Текст/Вторичный', 'accent/base'))

  filters.appendChild(text('КОРОБКА', 'Моно/Ярлык', 'text/muted'))
  const boxes = stack('Коробка', { horizontal: true, gap: 6, wrap: true })
  put(filters, boxes, 'fill')
  boxes.appendChild(chip('АКПП', true))
  boxes.appendChild(chip('МКПП', false))
  boxes.appendChild(chip('Вариатор', false))

  filters.appendChild(text('ЗАМЕРЫ', 'Моно/Ярлык', 'text/muted'))
  filters.appendChild(chip('С полной картой', true))

  put(filters, button('Показать 248', 'основная'), 'fill')
  return filters
}

function feedScreen() {
  const screen = screenShell('Лента · десктоп')
  put(screen, header(), 'fill')

  const body = stack('Тело', { horizontal: true, gap: 24, pad: 24, align: 'MIN' })
  put(screen, body, 'fill')

  body.appendChild(filtersPanel())

  // Сетка карточек: перенос по строкам, ширина по остатку. Ширина карточки фиксирована,
  // поэтому в 1280 их встаёт по три — так же, как в мокапе на этой ширине.
  const grid = stack('Карточки', { horizontal: true, gap: 16, wrap: true })
  put(body, grid, 'grow')
  grid.layoutSizingHorizontal = 'FILL'
  for (const car of CARS) grid.appendChild(listingCard(car))

  return screen
}
