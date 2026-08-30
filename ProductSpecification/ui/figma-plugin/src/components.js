// Компоненты: кнопка, чип, ярлык статуса, бейдж и карточка объявления.
//
// Собраны из `stack` и потому обнимают содержимое: кнопка ровно по подписи, карточка ровно
// по своей ширине. Ни один размер не задан на глаз, кроме тех, что действительно фиксированы
// сеткой — ширина карточки в ленте и высота слота под фотографию.

function button(label, kind) {
  const primary = kind === 'основная'
  const node = stack(`Кнопка/${kind}`, {
    horizontal: true,
    gap: 8,
    padLeft: 18,
    padRight: 18,
    padTop: 12,
    padBottom: 12,
    radius: RADIUS.control,
    align: 'CENTER',
    justify: 'CENTER',
    bg: primary ? 'accent/base' : 'bg/surface',
    border: primary ? undefined : 'border/subtle',
  })
  node.appendChild(text(label, 'Кнопка', primary ? 'text/inverse' : 'text/secondary'))
  return node
}

function chip(label, active) {
  const node = stack(`Чип/${active ? 'выбран' : 'обычный'}`, {
    horizontal: true,
    padLeft: 11,
    padRight: 11,
    padTop: 6,
    padBottom: 6,
    radius: RADIUS.chip,
    align: 'CENTER',
    bg: active ? 'accent/soft' : 'bg/surface',
    border: active ? 'accent/base' : 'border/subtle',
  })
  node.appendChild(text(label, 'Текст/Вторичный', active ? 'accent/base' : 'text/secondary'))
  return node
}

// Ярлык статуса объявления или оффера. Цвет берётся из шкалы замеров намеренно: зелёный
// «опубликовано» и зелёный «заводская краска» обязаны быть одним зелёным.
function statusTag(label, tone) {
  const node = stack(`Статус/${label}`, {
    horizontal: true,
    gap: 6,
    padLeft: 9,
    padRight: 9,
    padTop: 4,
    padBottom: 4,
    radius: 5,
    align: 'CENTER',
    bg: `measure/${tone}-soft`,
  })
  node.appendChild(text(label, 'Текст/Вторичный', `measure/${tone}`))
  return node
}

// Бейдж поверх фотографии: светлая подложка и цветная точка, а не заливка цветом. Залитый
// зелёным прямоугольник на фото машины перетягивает внимание с самой машины.
function photoBadge(label, tone) {
  const node = stack(`Бейдж/${label}`, {
    horizontal: true,
    gap: 6,
    padLeft: 9,
    padRight: 9,
    padTop: 4,
    padBottom: 4,
    radius: 4,
    align: 'CENTER',
    bg: 'bg/surface',
  })
  const dot = figma.createEllipse()
  dot.resize(7, 7)
  fill(dot, tone)
  node.appendChild(dot)
  node.appendChild(text(label, 'Текст/Вторичный', 'text/primary'))
  return node
}

const CARD_WIDTH = 288

function listingCard(data) {
  const card = stack('Карточка объявления', {
    gap: 0,
    width: CARD_WIDTH,
    radius: RADIUS.surface,
    bg: 'bg/surface',
    border: 'border/subtle',
  })

  const photo = photoSlot(CARD_WIDTH, 200, 'фото автомобиля')
  put(card, photo, 'fill')

  const body = stack('Содержимое', { gap: 6, pad: 16 })
  put(card, body, 'fill')

  const head = stack('Заголовок', { horizontal: true, gap: 10, justify: 'SPACE_BETWEEN' })
  put(body, head, 'fill')
  head.appendChild(text(data.title, 'Заголовок/Карточка'))
  head.appendChild(text(String(data.year), 'Заголовок/Карточка', 'text/muted'))

  body.appendChild(text(data.price, 'Цена/Лента'))
  put(body, text(data.specs, 'Текст/Вторичный', 'text/secondary'), 'fill')

  const foot = stack('Подвал', {
    horizontal: true,
    gap: 10,
    justify: 'SPACE_BETWEEN',
    padTop: 10,
  })
  put(body, foot, 'fill')
  // Линия только сверху: подвал отделяется от характеристик, а не обводится рамкой.
  stroke(foot, 'border/subtle', 1)
  foot.strokeTopWeight = 1
  foot.strokeBottomWeight = 0
  foot.strokeLeftWeight = 0
  foot.strokeRightWeight = 0
  foot.appendChild(text(data.city, 'Моно/Ярлык', 'text/muted'))
  foot.appendChild(text(data.vin, 'Моно/Ярлык', 'text/muted'))

  if (data.badge) {
    const badge = photoBadge(data.badge.label, data.badge.tone)
    card.appendChild(badge)
    // Абсолютное положение поверх фотографии — единственное место, где оно оправдано:
    // бейдж лежит НА снимке, а не в потоке карточки.
    badge.layoutPositioning = 'ABSOLUTE'
    badge.x = 10
    badge.y = 10
  }
  return card
}
