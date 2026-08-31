// Что означает адрес возврата от провайдера. Чистая функция, потому что развилка здесь
// решает судьбу входа, а проверять её через рендер экрана — дороже и хуже видно.
export type CallbackOutcome =
  { kind: 'exchange'; code: string } | { kind: 'refused'; reason: string } | { kind: 'malformed' }

// Сервер присылает свои причины отказа: подделанное или просроченное состояние, потерянный
// код, отказ провайдера. Человеку они говорят разное, поэтому текст разный.
const REASONS: Record<string, string> = {
  state_invalid: 'Ссылка возврата устарела или пришла не с того устройства. Начните вход заново.',
  code_missing: 'Провайдер вернул нас без кода входа. Попробуйте ещё раз.',
  provider_failed: 'Провайдер не подтвердил вход — возможно, вы закрыли окно или отклонили доступ.',
}

const DEFAULT_REASON =
  'Провайдер не подтвердил вход — возможно, вы закрыли окно или отклонили доступ.'

/** Порядок проверок важен: при отказе кода нет, и обмен не должен запускаться вовсе. */
export function callbackOutcome(params: URLSearchParams): CallbackOutcome {
  const error = params.get('error')
  if (error !== null) return { kind: 'refused', reason: REASONS[error] ?? DEFAULT_REASON }

  const code = params.get('code')?.trim() ?? ''
  // Пустой и неправдоподобно длинный код не тратим: это не выданный нам одноразовый код,
  // а мусор в адресной строке.
  if (!code || code.length > 512) return { kind: 'malformed' }
  return { kind: 'exchange', code }
}
