// Тема: выбор человека, системная настройка как значение по умолчанию.
//
// Механизм стоит в `index.html` — инлайновый скрипт ставит атрибут до первой отрисовки.
// Этот модуль — страховка и переключатель: он повторяет атрибут для случая, когда инлайн
// запрещён политикой безопасности (иначе приложение навсегда осталось бы светлым и нигде
// бы об этом не сказало), и он же меняет тему по нажатию.
import { browserDocument, browserStorage } from '../lib/browser'
import { notify, subscribe, type Listener } from '../lib/listeners'

export type Theme = 'light' | 'dark'
// Отдельно от Theme: «система» — это отсутствие выбора, а не третья палитра.
export type ThemeChoice = Theme | 'system'

const STORAGE_KEY = 'absolute.theme'

const listeners = new Set<Listener>()

export function subscribeToTheme(listener: Listener): () => void {
  return subscribe(listeners, listener)
}

export function themeChoice(): ThemeChoice {
  const saved = browserStorage()?.getItem(STORAGE_KEY)
  return saved === 'dark' || saved === 'light' ? saved : 'system'
}

// Что человек видит прямо сейчас — в отличие от того, что он выбрал.
export function effectiveTheme(): Theme {
  const choice = themeChoice()
  if (choice !== 'system') return choice
  return prefersDark() ? 'dark' : 'light'
}

export function setTheme(choice: ThemeChoice): void {
  try {
    if (choice === 'system') browserStorage()?.removeItem(STORAGE_KEY)
    else browserStorage()?.setItem(STORAGE_KEY, choice)
  } catch {
    // Хранилище недоступно — тема продержится до перезагрузки. Это лучше, чем падение.
  }
  applyChoice(choice)
  notify(listeners)
}

export function initTheme(): void {
  applyChoice(themeChoice())
}

function applyChoice(choice: ThemeChoice): void {
  const root = browserDocument()?.documentElement
  if (!root) return
  if (choice === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', choice)
}

function prefersDark(): boolean {
  return browserDocument()?.defaultView?.matchMedia('(prefers-color-scheme: dark)').matches ?? false
}
