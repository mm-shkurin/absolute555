// Ответы заглушки на изменяющие запросы.
//
// Отдельно от чтения: общий `{ok:true}` однажды уже вернул мастеру черновик без
// идентификатора, и тот откатывался на выбор файла — сценарий падал на шаге, который ни
// при чём. Здесь видно, какие мутации отвечают по-настоящему, а какие ещё нет.
import { saleCar } from './wire'

const STS = /^\/sale_car\/([^/]+)\/sts$/
const ONE = /^\/sale_car\/([^/]+)$/

export function mutation(path: string): unknown {
  if (path === '/sale_car') return saleCar('l1')

  const stsFor = STS.exec(path)?.[1]
  if (stsFor) {
    return {
      sale_car_id: stsFor,
      autofill: { state: 'pending', brand_source: null, model_source: null, updated_at: null },
    }
  }

  const patched = ONE.exec(path)?.[1]
  if (patched) return saleCar(patched)

  // Остальные кнопки, дошедшие до сети, не должны падать посреди клика.
  return { ok: true }
}
