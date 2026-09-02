// Подписки для сторов вне React: сессия, тема, счётчик непрочитанного. Три места хотели
// одного и того же — набор слушателей, подписка с отпиской и оповещение, — и каждое писало
// свой вариант, в котором отписка возвращалась то из подписки, то отдельной функцией.

export type Listener = () => void

export function subscribe(listeners: Set<Listener>, listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

// Копия набора перед обходом: слушатель вправе отписаться прямо в обработчике, а удаление
// из Set во время его же обхода пропускает следующего.
export function notify(listeners: Set<Listener>): void {
  for (const listener of Array.from(listeners)) listener()
}
