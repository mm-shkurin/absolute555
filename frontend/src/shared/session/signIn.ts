// Начало входа. Уводит всю страницу на серверный адрес: дальше браузер идёт к провайдеру,
// возвращается на серверный колбэк и приезжает к нам с одноразовым кодом. Поэтому это
// переход, а не запрос — приложению тут делать нечего до самого возврата.
import { BACKEND } from '../api/backend/paths'

export function beginSignIn(): void {
  window.location.assign(BACKEND.auth.yandexStart)
}
