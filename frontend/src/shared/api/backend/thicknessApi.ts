// Замеры толщиномера: чтение карты, запись и снятие замера панели.
//
// Клиент знает только форму провода. Что показать человеку — решает фича.
import { send } from '../send'
import { BACKEND } from './paths'
import type { BodyPanel, ThicknessMapWire } from './thicknessContract'

/** Карта читается теми же, кому видно само объявление; иначе сервер отвечает 404. */
export function fetchThicknessMap(saleCarId: string, signal?: AbortSignal) {
  return send<ThicknessMapWire>(BACKEND.thickness.map(saleCarId), { signal })
}

/** Идемпотентно по адресу панели: повторный вызов перезаписывает замер, а не заводит
 *  второй. Число и фотография уходят формой — как галерея и скан СТС, и по той же
 *  причине: снимок экрана прибора приезжает файлом, а не base64.
 *
 *  `valueUm === null` означает «прочитай сам»: сервер разбирает снимок и отвечает
 *  `422 OCR_UNREADABLE`, если не смог. Пустое поле формой не отправляется — сервер
 *  прочитал бы его как ноль. */
export function putMeasurement(
  saleCarId: string,
  panel: BodyPanel,
  valueUm: number | null,
  photo: File,
) {
  const form = new FormData()
  if (valueUm !== null) form.append('value_um', String(valueUm))
  form.append('photo', photo)
  return send<ThicknessMapWire>(BACKEND.thickness.panel(saleCarId, panel), {
    method: 'PUT',
    body: form,
  })
}

/** Убирается одна панель: «стереть всю карту» — кнопка, которой нет ни в макете,
 *  ни в контракте. */
export function deleteMeasurement(saleCarId: string, panel: BodyPanel) {
  return send<ThicknessMapWire>(BACKEND.thickness.panel(saleCarId, panel), { method: 'DELETE' })
}
