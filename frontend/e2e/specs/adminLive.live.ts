// Консоль против ЖИВОГО сервера, а не заглушки.
//
// Отдельно от `adminConsole.e2e.ts`: тот доказывает, что экран умеет показать и нажать,
// этот — что нажатие доходит до сервера и меняет там состояние. Первый зелён и на
// фикстурах; второй ловит ровно то, чего первый не видит.
//
// Расширение `.live.ts`, а не `.e2e.ts`, — намеренно: общий прогон идёт против собранного
// приложения на фикстурах, а этому нужен поднятый стек и права на базу. В общем списке он
// падал бы по причине, не имеющей отношения к тому, что проверяет.
//
// Запускается вручную против поднятого стека:
//   E2E_BASE_URL=http://localhost npx vitest run --config e2e/vitest.live.config.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { BASE_URL, DESKTOP, clickElement, openBrowser, resize, textOf, waitForVisible } from '../driver'

const API = process.env.E2E_API_URL ?? 'http://localhost:8100/api/v1'

async function guest(tag: string): Promise<{ token: string; id: string }> {
  const answer = await fetch(`${API}/auth/guest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: `live-${tag}-${Date.now()}` }),
  })
  const body = (await answer.json()) as { access_token: string }
  const claims = JSON.parse(
    Buffer.from(body.access_token.split('.')[1], 'base64').toString('utf8'),
  ) as { id: string }
  return { token: body.access_token, id: claims.id }
}

describe('Консоль против живого сервера', () => {
  let driver: WebDriver
  let victimId = ''

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)

    const admin = await guest('admin')
    const victim = await guest('victim')
    victimId = victim.id

    // Роль выдаётся тем же способом, что и в бэкендовых тестах: ручки, которая
    // производит администратора, у проекта нет.
    const { execSync } = await import('node:child_process')
    execSync(
      `docker compose exec -T postgres psql -U absolute -d absolute -q -c ` +
        `"update users set role='admin' where id='${admin.id}'; ` +
        `update users set is_guest=false where id='${victim.id}';"`,
      { cwd: '../infra', stdio: 'ignore' },
    )

    // Сессия кладётся до открытия экрана: роль приложение читает из неё, а не спрашивает
    // сервер на каждой отрисовке.
    await driver.get(`${BASE_URL}/feed`)
    await driver.executeScript(
      `localStorage.setItem('absolute.session', arguments[0])`,
      JSON.stringify({
        accessToken: admin.token,
        refreshToken: admin.token,
        userId: admin.id,
        role: 'admin',
        displayName: 'Проверяющий',
        avatarUrl: null,
      }),
    )
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('список людей наполняется тем, что отдал сервер', async () => {
    await driver.get(`${BASE_URL}/moderation/people`)

    const list = await waitForVisible(driver, 'people-list')
    expect((await list.getText()).length).toBeGreaterThan(0)
  })

  it('блокировка доходит до сервера и возвращается в карточку', async () => {
    await driver.get(`${BASE_URL}/moderation/people/${victimId}`)
    await waitForVisible(driver, 'admin-person')

    await clickElement(driver, await waitForVisible(driver, 'access-open'))
    const reason = await waitForVisible(driver, 'access-reason')
    await reason.sendKeys('проверка живого стека')
    await clickElement(driver, await waitForVisible(driver, 'access-confirm'))

    // Исход, а не промежуточная стадия: карточка перечитана с сервера и показывает
    // закрытый доступ вместе с причиной, которую сервер сохранил.
    await driver.wait(async () => (await textOf(driver, 'person-blocked')).includes('проверка живого стека'), 8000)
  })

  it('журнал показывает то, что сервер записал', async () => {
    await driver.get(`${BASE_URL}/moderation/people/${victimId}`)

    const journal = await waitForVisible(driver, 'person-journal')
    expect(await journal.getText()).toContain('Доступ закрыт')
  })
})
