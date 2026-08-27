// Какие части src/ кому разрешено импортировать и записанные исключения.
//
// Правило в одну строку: фича может импортировать себя и `shared`. Всё остальное поперёк
// границы фичи должно быть перечислено здесь, с причиной.
//
// Список пуст, и это цель, а не текущее состояние дел. В Textery, откуда правило взято,
// исключений было восемь, и все восемь — один и тот же шов: общему коду нужна личность
// вошедшего, а слой сессии лежал внутри `features/auth`. У нас сессия сразу в
// `shared/session`, поэтому шва нет. Новая строка здесь — сигнал, что что-то лежит не там.
export const ALLOWED_SHARED_TO_FEATURE = []

// Область, к которой принадлежит путь: фича — это `features/<имя>`, всё прочее — свой
// каталог верхнего уровня. Намеренно грубо: гейт про стены между фичами, а `components`
// против `hooks` внутри одной фичи — другой разговор.
export function areaOf(relativePath) {
  const parts = relativePath.split(/[\\/]/)
  return parts[0] === 'features' ? `features/${parts[1]}` : parts[0]
}

// Пути приходят с разделителем платформы, а все правила здесь записаны через `/`. Сравнение
// без нормализации проходит на Linux и падает на Windows — худшая форма для гейта: красное
// только у части команды приучает не смотреть на него вовсе.
const slashed = (path) => path.split('\\').join('/')

export function isAllowed({ fromArea, toArea, fromFile, toPath }) {
  if (fromArea === toArea) return true
  if (toArea === 'shared') return true
  // `app` сшивает экраны — импортировать каждую фичу это вся его работа. `main.tsx` —
  // точка входа и делает одно: монтирует `app`.
  if (fromArea === 'app' || fromArea === 'main.tsx') return true
  if (fromArea === 'shared') {
    return ALLOWED_SHARED_TO_FEATURE.some(
      (entry) => slashed(fromFile).endsWith(entry.from) && slashed(toPath).includes(entry.to),
    )
  }
  return false
}
