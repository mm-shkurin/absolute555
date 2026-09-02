// Создание переменных и текстовых стилей в документе.
//
// Переменные, а не цветовые стили: тема в Figma — это режим коллекции, и переключение
// светлая/тёмная должно быть одним кликом на фрейме, а не подменой полусотни стилей.
//
// Но второй режим доступен не всем: на бесплатном тарифе коллекция ограничена одним
// режимом, и `addMode` бросает «Limited to 1 modes only». Поэтому тёмная тема имеет
// запасной путь — отдельная коллекция с теми же именами переменных. Переключаться одним
// кликом она не даёт, зато значения лежат в файле и видны дизайнеру.
//
// Все обращения к документу асинхронные: манифест объявляет `documentAccess: dynamic-page`,
// под которым синхронные `getLocal*` бросают исключение.

async function ensureCollection(name) {
  const all = await figma.variables.getLocalVariableCollectionsAsync()
  const existing = all.find((collection) => collection.name === name)
  if (existing) return existing
  return figma.variables.createVariableCollection(name)
}

// Возвращает id режима для тёмной темы или null, если тариф второго режима не даёт.
function tryAddDarkMode(collection) {
  const existing = collection.modes.find((mode) => mode.name === 'Тёмная')
  if (existing) return existing.modeId
  try {
    return collection.addMode('Тёмная')
  } catch {
    return null
  }
}

async function variablesOf(collection) {
  const all = await figma.variables.getLocalVariablesAsync('COLOR')
  return new Map(
    all
      .filter((variable) => variable.variableCollectionId === collection.id)
      .map((variable) => [variable.name, variable]),
  )
}

// Заливает коллекцию значениями одной темы. Один запрос на все переменные вместо запроса
// на каждую: обращений тридцать, и по отдельности это тридцать ожиданий на ровном месте.
async function fillCollection(collection, modeId, theme) {
  const byName = await variablesOf(collection)
  const made = {}
  for (const [name, values] of Object.entries(COLORS)) {
    const variable = byName.get(name) || figma.variables.createVariable(name, collection, 'COLOR')
    variable.setValueForMode(modeId, hexToRgb(values[theme]))
    made[name] = variable
  }
  return made
}

async function buildColorVariables() {
  const collection = await ensureCollection('Абсолют')
  const [first] = collection.modes
  collection.renameMode(first.modeId, 'Светлая')

  const darkMode = tryAddDarkMode(collection)
  const variables = await fillCollection(collection, first.modeId, 'light')

  if (darkMode) {
    // Тариф разрешил второй режим: обе темы в одной коллекции, слои переключаются кликом.
    const byName = await variablesOf(collection)
    for (const [name, values] of Object.entries(COLORS)) {
      const variable = byName.get(name)
      if (variable) variable.setValueForMode(darkMode, hexToRgb(values.dark))
    }
    return { collection, variables, darkMode, darkCollection: null }
  }

  // Запасной путь: тёмные значения отдельной коллекцией. Слои к ней не привязаны — это
  // справочник, из которого дизайнер берёт цвет вручную или к которому перепривязывает
  // выделенное, когда рисует тёмный экран.
  const darkCollection = await ensureCollection('Абсолют · тёмная')
  await fillCollection(darkCollection, darkCollection.modes[0].modeId, 'dark')
  return { collection, variables, darkMode: null, darkCollection }
}

// Шрифты грузятся до создания текста: Figma отказывает в установке characters на узле,
// чей шрифт ещё не загружен, и отказ приходит исключением посреди построения.
async function loadFonts() {
  const wanted = new Map()
  for (const style of TEXT_STYLES) {
    wanted.set(`${style.family}|${style.style}`, { family: style.family, style: style.style })
  }
  wanted.set('Golos Text|Regular', { family: 'Golos Text', style: 'Regular' })
  wanted.set('Inter|Regular', { family: 'Inter', style: 'Regular' })

  const missing = []
  for (const font of wanted.values()) {
    try {
      await figma.loadFontAsync(font)
    } catch {
      missing.push(`${font.family} ${font.style}`)
    }
  }
  return missing
}

// Возвращает карту «имя стиля → id»: дальше текст создаётся десятки раз, и запрашивать
// список стилей на каждый узел значит десятки асинхронных обращений вместо одного.
async function buildTextStyles(missingFonts) {
  const existing = await figma.getLocalTextStylesAsync()
  const byName = new Map(existing.map((style) => [style.name, style]))
  const ids = {}

  for (const spec of TEXT_STYLES) {
    const style = byName.get(spec.name) || figma.createTextStyle()
    style.name = spec.name
    // Шрифт ставим только если он загрузился: присвоение незагруженного начертания —
    // исключение, которое роняет плагин на первом же стиле.
    if (!missingFonts.includes(`${spec.family} ${spec.style}`)) {
      style.fontName = { family: spec.family, style: spec.style }
    }
    style.fontSize = spec.size
    style.lineHeight = { unit: 'PIXELS', value: spec.line }
    style.letterSpacing = { unit: 'PIXELS', value: spec.spacing }
    ids[spec.name] = style.id
  }
  return ids
}
