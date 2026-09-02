// Токены дизайн-системы. Источник — ProductSpecification/ui/ui-conventions.md и
// frontend/src/styles/tokens-*.css; здесь третья копия тех же значений, и это осознанная
// цена: Figma не читает CSS, а плагин не умеет тянуть файл из репозитория.
//
// Раз копия неизбежна, она хотя бы одна и в одном месте. Расхождение значений между этим
// файлом и tokens-light.css — ошибка; первоисточник — CSS, потому что он исполняется.

// Оба режима одной коллекции переменных: в Figma переключение темы — это смена режима,
// а не второй набор стилей. Имя переменной одно, значений два.
const COLORS = {
  'bg/page': { light: '#F1F4F9', dark: '#0D141F' },
  'bg/surface': { light: '#FFFFFF', dark: '#1A2334' },
  'bg/sunken': { light: '#F1F4F9', dark: '#131B28' },
  'bg/selected': { light: '#E8EFFB', dark: '#14284D' },
  'bg/inverse': { light: '#0D141F', dark: '#E8EDF5' },

  'border/subtle': { light: '#DEE4EE', dark: '#23304A' },
  'border/strong': { light: '#B6C6DE', dark: '#35476B' },

  'text/primary': { light: '#0D141F', dark: '#F1F4F9' },
  'text/secondary': { light: '#3F4B5E', dark: '#AEBBD0' },
  'text/muted': { light: '#78849A', dark: '#7D8AA3' },
  'text/inverse': { light: '#FFFFFF', dark: '#0D141F' },

  'accent/base': { light: '#0066FF', dark: '#4D94FF' },
  'accent/hover': { light: '#0047CC', dark: '#7AB0FF' },
  'accent/soft': { light: '#E8EFFB', dark: '#14284D' },

  // Шкала замеров толщиномера — единственная многоцветная группа в продукте.
  'measure/ok': { light: '#17A66B', dark: '#35C98A' },
  'measure/ok-soft': { light: '#E4F7EE', dark: '#10301F' },
  'measure/warn': { light: '#F0A020', dark: '#F5B74F' },
  'measure/warn-soft': { light: '#FEF3E0', dark: '#33260C' },
  'measure/bad': { light: '#E5484D', dark: '#FF6B70' },
  'measure/bad-soft': { light: '#FDECEC', dark: '#3A1416' },
  'measure/none': { light: '#C3CEDF', dark: '#46536B' },
}

// Типографика. Golos Text — интерфейс, JetBrains Mono — служебный слой: моноширинный
// означает «это данные или метка», а не украшение.
const TEXT_STYLES = [
  { name: 'Заголовок/H1 десктоп', family: 'Golos Text', style: 'ExtraBold', size: 60, line: 61, spacing: -2.1 },
  { name: 'Заголовок/H1 мобилка', family: 'Golos Text', style: 'ExtraBold', size: 34, line: 37, spacing: -1.1 },
  { name: 'Заголовок/H2', family: 'Golos Text', style: 'Bold', size: 33, line: 37, spacing: -0.9 },
  { name: 'Заголовок/Блок', family: 'Golos Text', style: 'SemiBold', size: 18, line: 24, spacing: -0.27 },
  { name: 'Заголовок/Карточка', family: 'Golos Text', style: 'SemiBold', size: 16.5, line: 21, spacing: -0.17 },
  { name: 'Цена/Лента', family: 'Golos Text', style: 'Bold', size: 21, line: 25, spacing: -0.42 },
  { name: 'Цена/Карточка', family: 'Golos Text', style: 'Bold', size: 33, line: 38, spacing: -0.99 },
  { name: 'Текст/Основной', family: 'Golos Text', style: 'Medium', size: 16, line: 24, spacing: 0 },
  { name: 'Текст/Вторичный', family: 'Golos Text', style: 'Regular', size: 14.5, line: 22, spacing: 0 },
  { name: 'Кнопка', family: 'Golos Text', style: 'SemiBold', size: 15, line: 20, spacing: -0.08 },
  { name: 'Моно/Ярлык', family: 'JetBrains Mono', style: 'Regular', size: 11, line: 14, spacing: 1.5 },
  { name: 'Моно/Данные', family: 'JetBrains Mono', style: 'Medium', size: 13.5, line: 18, spacing: 0.3 },
]

// Геометрия. Радиусы разные по назначению: одинаковый радиус на всём — признак макета,
// собранного из одного прямоугольника.
const RADIUS = { surface: 14, control: 10, chip: 7, thumb: 8, pill: 999 }

const SPACING = [4, 8, 12, 16, 24, 32, 48, 64]

function hexToRgb(hex) {
  const value = hex.replace('#', '')
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  }
}
