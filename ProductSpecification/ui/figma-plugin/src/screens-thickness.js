// Экран карты замеров: схема кузова слева, список панелей справа. Клик по панели в Figma
// не работает по определению — интерактив живёт в HTML-мокапе, здесь только состояние.

const SCALE = [
  ['заводская', 'measure/ok'],
  ['перекрашено', 'measure/warn'],
  ['шпаклёвка', 'measure/bad'],
  ['не замерено', 'measure/none'],
]

const PANELS = [
  ['Капот', '96 мкм', 'ok'],
  ['Крыша', '91 мкм', 'ok'],
  ['Крышка багажника', '168 мкм', 'warn'],
  ['Крыло переднее левое', '103 мкм', 'ok'],
  ['Крыло переднее правое', '640 мкм', 'bad'],
  ['Дверь передняя правая', '210 мкм', 'warn'],
  ['Дверь задняя правая', '—', 'none'],
  ['Бампер задний', '102 мкм', 'ok'],
]

function swatch(tone, size) {
  const node = figma.createRectangle()
  node.resize(size, size)
  node.cornerRadius = 3
  fill(node, tone)
  return node
}

function legend() {
  const row = stack('Легенда', { horizontal: true, gap: 16, wrap: true })
  for (const [label, tone] of SCALE) {
    const item = stack(label, { horizontal: true, gap: 6, align: 'CENTER' })
    item.appendChild(swatch(tone, 12))
    item.appendChild(text(label, 'Текст/Вторичный', 'text/secondary'))
    row.appendChild(item)
  }
  return row
}

function measurementRow(name, value, tone) {
  const row = stack(name, {
    horizontal: true,
    gap: 10,
    padTop: 8,
    padBottom: 8,
    align: 'CENTER',
    justify: 'SPACE_BETWEEN',
  })
  const left = stack('Панель', { horizontal: true, gap: 10, align: 'CENTER' })
  left.appendChild(swatch(`measure/${tone}`, 12))
  left.appendChild(text(name, 'Текст/Вторичный'))
  row.appendChild(left)
  row.appendChild(text(value, 'Моно/Данные', tone === 'none' ? 'text/muted' : 'text/primary'))
  return row
}

function thicknessScreen() {
  const screen = screenShell('Карта замеров · десктоп')
  put(screen, header(), 'fill')

  const body = stack('Тело', { horizontal: true, gap: 24, pad: 24, align: 'MIN' })
  put(screen, body, 'fill')

  const sheet = panel('Схема кузова', { gap: 16, pad: 20 })
  put(body, sheet, 'grow')
  sheet.layoutSizingHorizontal = 'FILL'
  sheet.appendChild(svgNode('Кузов, две проекции', BODY_SVG))
  put(sheet, legend(), 'fill')

  const list = panel('Замеры', { width: 320, gap: 0, pad: 20 })
  body.appendChild(list)
  const head = stack('Шапка списка', {
    horizontal: true,
    justify: 'SPACE_BETWEEN',
    align: 'CENTER',
    padBottom: 8,
  })
  put(list, head, 'fill')
  head.appendChild(text('Замеры', 'Заголовок/Блок'))
  head.appendChild(text('11 из 13', 'Текст/Вторичный', 'text/muted'))

  for (const [name, value, tone] of PANELS) {
    const row = measurementRow(name, value, tone)
    put(list, row, 'fill')
    // Линия-разделитель между строками, а не рамка вокруг каждой: список читается
    // сплошным, и глаз не спотыкается о восемь прямоугольников.
    stroke(row, 'border/subtle', 1)
    row.strokeTopWeight = 1
    row.strokeBottomWeight = 0
    row.strokeLeftWeight = 0
    row.strokeRightWeight = 0
  }
  return screen
}
