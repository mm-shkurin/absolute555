import { useCallback, useEffect, useRef, useState } from 'react'
import { createDraft as startDraft } from '../../shared/api/backend/saleCarApi'
import type { ListingKind } from '../../shared/api/backend/saleCarContract'
import { browserWindow } from '../../shared/lib/browser'

/** Адрес мастера получает id только что заведённого черновика. Без этого `/sell` оставался
 *  `/sell`: обновление страницы или возврат заводили новый пустой черновик, а начатый
 *  терялся среди них. Адрес меняется мимо роутера намеренно: навигация перезапустила бы
 *  загрузку черновика с сервера и затёрла бы то, что человек уже ввёл на экране. */
function rememberInAddress(saleCarId: string) {
  const win = browserWindow()
  if (!win) return
  const path = win.location.pathname.replace(/\/+$/, '')
  if (path !== '/sell') return
  win.history.replaceState(win.history.state, '', `/sell/${saleCarId}`)
}

/** Отмены здесь нет намеренно. Первый заход эффекта в режиме строгой проверки сразу
 *  отменяется и запускается заново, а обещание создания уже сохранено — отменённый заход
 *  разрешался бы в «черновика нет», и загрузка снимка ждала бы именно его, навсегда.
 *  Записать идентификатор в размонтированном мастере безвредно: это ссылка, а не
 *  состояние, и следующий заход её же и переиспользует. */
function createDraft(kind: ListingKind | undefined, adopt: (id: string) => void) {
  return (
    startDraft(kind)
      .then((car) => {
        adopt(car.sale_car_id)
        rememberInAddress(car.sale_car_id)
        return car.sale_car_id
      })
      // Гость и оборванная сеть выглядят здесь одинаково: черновик остаётся только на
      // экране, и мастер об этом молчит до попытки отправки — поэтому отказ не ошибка.
      .catch(() => null)
  )
}

/** Идентификатор нужен обработчикам сразу после создания, до следующего рендера, поэтому
 *  он живёт и в ссылке. Обещание создания хранится, потому что снимок СТС выбирают раньше,
 *  чем вернётся ответ, и без ожидания он уходил бы в никуда. */
export function useDraftCreation(enabled: boolean, existingId?: string, kind?: ListingKind) {
  const [saleCarId, setSaleCarId] = useState<string | null>(null)
  const idRef = useRef<string | null>(existingId ?? null)
  const creating = useRef<Promise<string | null> | null>(null)

  const draftId = useCallback(async () => {
    if (idRef.current) return idRef.current
    return (await creating.current) ?? null
  }, [])

  useEffect(() => {
    const adopt = (id: string) => {
      idRef.current = id
      setSaleCarId(id)
    }
    if (existingId) {
      adopt(existingId)
      return
    }
    if (!enabled || idRef.current || creating.current) return
    creating.current = createDraft(kind, adopt)
  }, [enabled, existingId, kind])

  return { saleCarId, idRef, draftId }
}
