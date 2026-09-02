// Общее для экранов: оболочка, шапка и схема кузова.
//
// Схема приходит через `createNodeFromSvg` — единственный способ получить в Figma
// редактируемые векторы, а не картинку. Разметка та же, что в мокапе.

const BODY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="300" viewBox="0 0 520 300">
  <g stroke="#93A9C9" stroke-width="1.5" fill="none" stroke-linejoin="round">
    <path d="M28 176 L28 150 Q28 138 44 136 L120 134 L186 90 Q194 84 206 84 L316 84
      Q330 84 338 90 L392 134 L474 138 Q496 142 500 156 L500 176 Z"/>
    <path d="M132 132 L192 94 L252 94 L252 132 Z M262 132 L262 94 L312 94 L364 132 Z"/>
    <path d="M120 134 L120 176 M252 132 L252 176 M262 94 L262 176 M392 134 L392 176"/>
    <circle cx="140" cy="176" r="27"/><circle cx="140" cy="176" r="12"/>
    <circle cx="400" cy="176" r="27"/><circle cx="400" cy="176" r="12"/>
    <path d="M64 268 Q64 232 118 226 L420 222 Q474 228 486 254 Q474 280 420 286 L118 282
      Q64 276 64 268 Z"/>
  </g>
  <g stroke="#FFFFFF" stroke-width="1.6">
    <path d="M28 176 L28 150 Q28 138 44 136 L120 134 L120 176 Z" fill="#17A66B"/>
    <path d="M132 134 L252 134 L252 176 L132 176 Z" fill="#17A66B"/>
    <path d="M262 134 L364 134 L364 176 L262 176 Z" fill="#F0A020"/>
    <path d="M366 142 L500 150 L500 176 L366 176 Z" fill="#C3CEDF"/>
    <path d="M186 90 Q194 84 206 84 L316 84 Q330 84 338 90 L332 96 L192 96 Z" fill="#17A66B"/>
    <path d="M126 232 L194 232 L194 278 L126 278 Z" fill="#17A66B"/>
    <path d="M198 230 L336 229 L336 279 L198 278 Z" fill="#17A66B"/>
    <path d="M340 230 L470 234 L470 276 L340 280 Z" fill="#E5484D"/>
  </g>
</svg>`

const SCREEN_WIDTH = 1280

function svgNode(name, markup) {
  const node = figma.createNodeFromSvg(markup)
  node.name = name
  return node
}

// Оболочка экрана: ширина фиксирована сеткой, высота обнимает содержимое. Именно так, а не
// наоборот: высоту экрана задаёт то, что в нём лежит, и любое «нарисуем 900 и хватит»
// заканчивается обрезанным низом.
function screenShell(name) {
  const screen = stack(name, { gap: 0, width: SCREEN_WIDTH, bg: 'bg/page' })
  return screen
}

function header() {
  const bar = stack('Шапка', {
    horizontal: true,
    gap: 24,
    padLeft: 24,
    padRight: 24,
    padTop: 16,
    padBottom: 16,
    align: 'CENTER',
    bg: 'bg/surface',
  })
  stroke(bar, 'border/subtle', 1)
  bar.strokeTopWeight = 0
  bar.strokeLeftWeight = 0
  bar.strokeRightWeight = 0
  bar.strokeBottomWeight = 1

  bar.appendChild(text('Абсолют', 'Заголовок/Блок'))

  const nav = stack('Разделы', { horizontal: true, gap: 20, align: 'CENTER' })
  nav.appendChild(text('В наличии', 'Текст/Основной', 'text/primary'))
  nav.appendChild(text('Под заказ', 'Текст/Основной', 'text/secondary'))
  nav.appendChild(text('Поставщики', 'Текст/Основной', 'text/secondary'))
  bar.appendChild(nav)

  // Распорка вместо выравнивания по краям: между логотипом и разделами расстояние
  // постоянное, а весь остаток должен уходить вправо, к кнопкам.
  const spacer = stack('Распорка', { gap: 0 })
  put(bar, spacer, 'grow')

  bar.appendChild(button('Войти', 'вторичная'))
  bar.appendChild(button('Разместить', 'основная'))
  return bar
}

// Панель на карточной поверхности: рамка, радиус, отступы. Из неё собраны фильтры,
// схема кузова и список замеров — три места, где отличались только внутренности.
function panel(name, options) {
  const config = options || {}
  return stack(name, {
    gap: config.gap === undefined ? 12 : config.gap,
    pad: config.pad === undefined ? 16 : config.pad,
    width: config.width,
    radius: RADIUS.surface,
    bg: 'bg/surface',
    border: 'border/subtle',
  })
}
