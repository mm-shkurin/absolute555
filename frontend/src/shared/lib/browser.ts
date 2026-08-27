// Единственный ответ на вопрос «мы в браузере». Доступ к `window`, `document` и хранилищу
// идёт через этот модуль, а не напрямую: под jsdom и под сборкой без DOM прямое обращение
// падает в разных местах по-разному, и каждое такое место обзаводится своим `typeof window`.

export function browserWindow(): Window | undefined {
  return typeof window === 'undefined' ? undefined : window
}

export function browserDocument(): Document | undefined {
  return typeof document === 'undefined' ? undefined : document
}

// Хранилище может быть недоступно и в браузере: приватное окно, отключённые данные сайта,
// политика домена. Поэтому не «есть ли window», а «получилось ли обратиться».
export function browserStorage(): Storage | undefined {
  try {
    return browserWindow()?.localStorage
  } catch {
    return undefined
  }
}
