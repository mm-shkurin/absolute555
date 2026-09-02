// Точка входа плагина: страница дизайн-системы, затем экраны.
//
// Всё складывается на отдельную страницу «Абсолют — система», а не в текущую: плагин,
// роняющий полсотни слоёв поверх чужой работы, запускают один раз и больше никогда.

// Страницы под `dynamic-page` перечислять можно, а вот лезть в их содержимое — только
// после загрузки. Нам содержимое не нужно: ищем по имени и, если нет, создаём.
function page(name) {
  const existing = figma.root.children.find((node) => node.name === name)
  if (existing) return existing
  const created = figma.createPage()
  created.name = name
  return created
}

function section(parent, title, x, y) {
  const holder = stack(title, { gap: 20 })
  parent.appendChild(holder)
  holder.x = x
  holder.y = y
  holder.appendChild(text(title, 'Заголовок/H2'))
  return holder
}

function swatches(parent) {
  const grid = stack('Цвета', { horizontal: true, gap: 12, wrap: true, width: 940 })
  parent.appendChild(grid)
  for (const [name, values] of Object.entries(COLORS)) {
    const cell = stack(name, {
      gap: 8,
      pad: 12,
      width: 220,
      radius: RADIUS.chip,
      bg: 'bg/surface',
      border: 'border/subtle',
    })
    const sample = stack(`Образец ${name}`, { gap: 0, radius: 6, bg: name })
    put(cell, sample, 'fill')
    sample.resize(sample.width, 52)
    sample.layoutSizingVertical = 'FIXED'
    stroke(sample, 'border/subtle', 1)
    cell.appendChild(text(name, 'Текст/Вторичный'))
    cell.appendChild(text(`${values.light} · ${values.dark}`, 'Моно/Ярлык', 'text/muted'))
    grid.appendChild(cell)
  }
}

function typeSamples(parent) {
  const column = stack('Типографика', { gap: 14 })
  for (const spec of TEXT_STYLES) {
    const row = stack(spec.name, { gap: 4 })
    row.appendChild(text(spec.name, 'Моно/Ярлык', 'text/muted'))
    row.appendChild(text('Авторынок Омска · 4 020 000 ₽ · 640 мкм', spec.name))
    column.appendChild(row)
  }
  parent.appendChild(column)
}

function componentSamples(parent) {
  const row = stack('Компоненты', { horizontal: true, gap: 16, align: 'CENTER', wrap: true, width: 940 })
  parent.appendChild(row)
  row.appendChild(button('Предложить цену', 'основная'))
  row.appendChild(button('Написать', 'вторичная'))
  row.appendChild(chip('АКПП', true))
  row.appendChild(chip('МКПП', false))
  row.appendChild(statusTag('опубликовано', 'ok'))
  row.appendChild(statusTag('на модерации', 'warn'))
  row.appendChild(statusTag('отклонено', 'bad'))
  row.appendChild(photoBadge('полная карта замеров', 'measure/ok'))
  row.appendChild(listingCard(CARS[0]))
}

// Что сказать человеку в конце. Молчаливый плагин, который частично не сработал, хуже
// упавшего: упавший виден сразу, а тихий обнаруживается через неделю, когда тёмная тема
// не переключается и никто не помнит почему.
function summary(built, missingFonts) {
  const parts = [`Готово: ${Object.keys(COLORS).length} переменных, ${TEXT_STYLES.length} стилей, два экрана.`]
  if (built.darkMode) {
    parts.push('Тёмная тема — режимом коллекции: выдели фрейм и переключи в панели справа.')
  } else {
    parts.push(
      'Второй режим тариф не даёт («Limited to 1 modes only»), поэтому тёмные значения лежат' +
        ' отдельной коллекцией «Абсолют · тёмная» — переключения одним кликом не будет.',
    )
  }
  if (missingFonts.length) {
    parts.push(`Не нашлись шрифты: ${missingFonts.join(', ')} — поставь их и запусти снова.`)
  }
  return parts.join(' ')
}

async function run() {
  // Порядок обязателен: сначала шрифты (иначе первый же текстовый узел бросит исключение),
  // потом переменные, потом стили — стилям нужны загруженные начертания, а слоям нужны
  // и стили, и переменные.
  const missingFonts = await loadFonts()
  const built = await buildColorVariables()
  useVariables(built.variables)
  useTextStyles(await buildTextStyles(missingFonts))

  const systemPage = page('Абсолют — система')
  await figma.setCurrentPageAsync(systemPage)

  const colors = section(systemPage, 'Цвета', 0, 0)
  swatches(colors)
  const type = section(systemPage, 'Типографика', 1040, 0)
  typeSamples(type)
  const parts = section(systemPage, 'Компоненты', 0, 1200)
  componentSamples(parts)

  const screensPage = page('Абсолют — экраны')
  const feed = feedScreen()
  screensPage.appendChild(feed)
  feed.x = 0
  feed.y = 0
  const thickness = thicknessScreen()
  screensPage.appendChild(thickness)
  thickness.x = SCREEN_WIDTH + 120
  thickness.y = 0

  // Стили назначаются последними: к этому моменту созданы все текстовые узлы обеих страниц,
  // и привязка проходит одним проходом вместо await на каждой подписи.
  await applyTextStyles()

  figma.viewport.scrollAndZoomIntoView(systemPage.children)

  figma.notify(summary(built, missingFonts), { timeout: 12000 })
  figma.closePlugin()
}

run().catch((error) => {
  figma.notify(`Плагин упал: ${error && error.message ? error.message : error}`)
  figma.closePlugin()
})
