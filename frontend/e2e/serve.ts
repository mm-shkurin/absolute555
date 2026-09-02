// Поднять приложение на фикстурах перед прогоном и погасить после.
//
// Именно на фикстурах, а не на живом бэкенде: сценарии проверяют интерфейс, и падение
// от того, что у кого-то не запущен Postgres, отучает смотреть на красный прогон быстрее,
// чем любой настоящий баг.
//
// И именно собранное приложение, а не дев-сервер: vite умирает от необработанного
// ECONNRESET, когда браузер закрывается между файлами сценариев, и весь прогон после этого
// сыпался отказами соединения. Статическая раздача сборки этого канала не имеет вовсе.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { openSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BASE_URL } from './driver'

let server: ChildProcess | null = null
// Пока прогон идёт, сервер обязан быть живым. Vite умирает от необработанного ECONNRESET,
// когда браузер закрывается между файлами сценариев, — чинится это не здесь, а в самом
// vite, поэтому прогон просто поднимает его заново, а не сыплет двумя десятками
// одинаковых отказов соединения.
let wanted = false

const PORT = new URL(BASE_URL).port
const WINDOWS = process.platform === 'win32'

// Журнал сервера. Он умирал посреди прогона, и в `stdio: 'ignore'` от него не оставалось
// ни строки — все сценарии просто падали с ERR_CONNECTION_REFUSED, одинаково и молча.
export const SERVER_LOG = join(tmpdir(), 'absolute-e2e-server.log')

export async function setup(): Promise<void> {
  wanted = true
  // Уже поднятый вручную сервер переиспользуем: разработчик, который держит `dev:mock`
  // открытым, не должен ловить конфликт порта на каждом прогоне.
  if (await isUp()) return
  await start()
}

async function start(): Promise<void> {
  const log = openSync(SERVER_LOG, 'a')
  // Команда строкой, а не именем с аргументами: с `shell: true` Node предупреждает, что
  // аргументы не экранируются, — а оболочка на Windows обязательна, там Node отказывается
  // запускать `npm.cmd` напрямую (EINVAL). Порт числовой и приходит из своего же конфига.
  spawnSync(`npm run build:mock`, { cwd: process.cwd(), shell: true, stdio: ['ignore', log, log] })

  server = spawn(`npm run preview:mock -- --port ${PORT}`, {
    cwd: process.cwd(),
    shell: true,
    // Своя группа процессов, чтобы гасить дерево целиком: под `npm` живёт vite, и смерть
    // одной обёртки оставила бы порт занятым до конца сессии.
    detached: !WINDOWS,
    stdio: ['ignore', log, log],
    // Живая перезагрузка выключается в конфиге по этому признаку — см. vite.config.ts.
    env: { ...process.env, E2E: '1' },
  })

  server.on('exit', (code) => {
    if (!wanted) return
    console.error(`Дев-сервер упал с кодом ${code}, поднимаю заново. Журнал: ${SERVER_LOG}`)
    void start()
  })

  await waitUntilUp(Date.now() + 60_000)
}

export async function teardown(): Promise<void> {
  wanted = false
  const running = server
  server = null
  if (!running?.pid) return

  if (WINDOWS) {
    // `kill` убивает только обёртку npm, а vite остаётся держать порт.
    spawnSync('taskkill', ['/pid', String(running.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  process.kill(-running.pid, 'SIGTERM')
}

// Рекурсия вместо цикла с ожиданием внутри: опрос последователен по сути — следующая
// попытка нужна, только если предыдущая не удалась, — и в таком виде это видно из кода.
async function waitUntilUp(deadline: number): Promise<void> {
  if (await isUp()) return
  if (Date.now() > deadline) {
    throw new Error(`Приложение не поднялось на ${BASE_URL} за минуту. Журнал: ${SERVER_LOG}`)
  }
  await new Promise((resolve) => setTimeout(resolve, 300))
  return waitUntilUp(deadline)
}

async function isUp(): Promise<boolean> {
  try {
    const response = await fetch(BASE_URL, { signal: AbortSignal.timeout(1000) })
    return response.ok
  } catch {
    return false
  }
}
