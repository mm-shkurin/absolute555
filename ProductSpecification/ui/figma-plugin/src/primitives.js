// Мелкие обёртки над Figma API. Существуют ради двух вещей: привязки к переменной и
// предсказуемого авторазмера.
//
// Прямой `fills = [{type:'SOLID', color}]` кладёт в макет сырое значение, и слой перестаёт
// реагировать на смену режима. Через `setBoundVariableForPaint` слой держит ссылку.
//
// Размеры задаются через `layoutSizingHorizontal/Vertical` ('FIXED' / 'HUG' / 'FILL'), а не
// через старые `primaryAxisSizingMode`. Старая пара выражает то же самое, но привязана к оси
// автолейаута: для вертикального стека «primary» — высота, для горизонтального — ширина.
// Достаточно один раз перепутать, чтобы фрейм остался сотней пикселей высотой и обрезал
// содержимое, — ровно это и случилось с первой версией экранов.

let VARS = {}
let TEXT_IDS = {}

// Узлы, которым ещё предстоит назначить текстовый стиль. Под `dynamic-page` присвоение
// `textStyleId` синхронно запрещено, а `setTextStyleIdAsync` внутри `text()` сделал бы
// асинхронным каждый построитель экрана — сорок await ради одной строки.
const PENDING_STYLES = []

function useVariables(variables) {
  VARS = variables
}

function useTextStyles(ids) {
  TEXT_IDS = ids
}

function paint(tokenName) {
  const variable = VARS[tokenName]
  const base = { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }
  if (!variable) return base
  return figma.variables.setBoundVariableForPaint(base, 'color', variable)
}

function fill(node, tokenName) {
  node.fills = [paint(tokenName)]
  return node
}

function stroke(node, tokenName, weight) {
  node.strokes = [paint(tokenName)]
  node.strokeWeight = weight || 1
  node.strokeAlign = 'INSIDE'
  return node
}

// Стек с автолейаутом. По умолчанию обнимает содержимое по обеим осям: размер задаёт
// содержимое, а не догадка автора.
function stack(name, options) {
  const config = options || {}
  const node = figma.createFrame()
  node.name = name
  node.layoutMode = config.horizontal ? 'HORIZONTAL' : 'VERTICAL'
  node.itemSpacing = config.gap === undefined ? 12 : config.gap
  node.paddingTop = config.padTop === undefined ? config.pad || 0 : config.padTop
  node.paddingBottom = config.padBottom === undefined ? config.pad || 0 : config.padBottom
  node.paddingLeft = config.padLeft === undefined ? config.pad || 0 : config.padLeft
  node.paddingRight = config.padRight === undefined ? config.pad || 0 : config.padRight
  node.counterAxisAlignItems = config.align || 'MIN'
  node.primaryAxisAlignItems = config.justify || 'MIN'
  node.cornerRadius = config.radius || 0
  // Обрезка выключена: пока макет собирается, обрезанный фрейм молча прячет ошибку размера
  // вместо того, чтобы её показать.
  node.clipsContent = false
  node.fills = []
  if (config.bg) fill(node, config.bg)
  if (config.border) stroke(node, config.border, 1)

  node.layoutSizingHorizontal = 'HUG'
  node.layoutSizingVertical = 'HUG'
  if (config.width) {
    node.resize(config.width, node.height)
    node.layoutSizingHorizontal = 'FIXED'
  }
  if (config.wrap) node.layoutWrap = 'WRAP'
  return node
}

// Положить ребёнка в стек и растянуть. Отдельной функцией, потому что 'FILL' разрешён
// только после вставки в автолейаут: присвоение до неё бросает исключение.
function put(parent, child, mode) {
  parent.appendChild(child)
  if (mode === 'fill') child.layoutSizingHorizontal = 'FILL'
  if (mode === 'grow') child.layoutGrow = 1
  return child
}

function text(content, styleName, tokenName) {
  const node = figma.createText()
  // Размер и начертание ставим сразу: если стиль почему-то не назначится, узел всё равно
  // выглядит правильно, а не дефолтным Inter.
  const spec = TEXT_STYLES.find((item) => item.name === styleName)
  if (spec) {
    try {
      node.fontName = { family: spec.family, style: spec.style }
    } catch {
      // Шрифта нет в системе — остаётся начертание по умолчанию, размеры применятся.
    }
    node.fontSize = spec.size
    node.lineHeight = { unit: 'PIXELS', value: spec.line }
    node.letterSpacing = { unit: 'PIXELS', value: spec.spacing }
  }
  node.characters = content
  fill(node, tokenName || 'text/primary')
  if (TEXT_IDS[styleName]) PENDING_STYLES.push([node, TEXT_IDS[styleName]])
  return node
}

async function applyTextStyles() {
  for (const [node, styleId] of PENDING_STYLES) {
    try {
      await node.setTextStyleIdAsync(styleId)
    } catch {
      // Стиль мог быть удалён между созданием и привязкой. Узел уже несёт нужные размеры,
      // так что теряется связь с библиотекой, а не внешний вид.
    }
  }
  PENDING_STYLES.length = 0
}

// Заглушка под фотографию. Настоящую диагональную штриховку пришлось бы делать векторной
// сеткой, а слой всё равно заменят снимком — поэтому утопленная поверхность с подписью.
function photoSlot(width, height, caption) {
  const node = stack(caption, {
    width,
    radius: RADIUS.thumb,
    bg: 'bg/sunken',
    border: 'border/subtle',
    align: 'CENTER',
    justify: 'CENTER',
  })
  node.appendChild(text(caption, 'Моно/Ярлык', 'text/muted'))
  node.resize(width, height)
  node.layoutSizingVertical = 'FIXED'
  return node
}
