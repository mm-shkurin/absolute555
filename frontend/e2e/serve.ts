// Поднять приложение на фикстурах перед прогоном и погасить после.
//
// Именно на фикстурах, а не на живом бэкенде: сценарии проверяют интерфейс, и падение
// от того, что у кого-то не запущен Postgres, отучает смотреть на красный прогон быстрее,
// чем любой настоящий баг.
import { spawn, type ChildProcess } from 'node:child_process'
import { BASE_URL } from './driver'

let server: ChildProcess | null = null

const PORT = new URL(BASE_URL).port

export async function setup(): Promise<void> {
  // Уже поднятый вручную сервер переиспользуем: разработчик, который держит `dev:mock`
  // открытым, не должен ловить конфликт порта на каждом прогоне.
  if (await isUp()) return

  server = spawn('npm', ['run', 'dev:mock', '--', '--port', PORT], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'ignore',
  })

  await waitUntilUp(Date.now() + 30_000)
}

export async function teardown(): Promise<void> {
  server?.kill()
  server = null
}

// Рекурсия вместо цикла с ожиданием внутри: опрос последователен по сути — следующая
// попытка нужна, только если предыдущая не удалась, — и в таком виде это видно из кода.
async function waitUntilUp(deadline: number): Promise<void> {
  if (await isUp()) return
  if (Date.now() > deadline) {
    throw new Error(`Приложение не поднялось на ${BASE_URL} за 30 секунд.`)
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
