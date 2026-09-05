// Разбор восьми замечаний с экрана — против живого стека, а не фикстур.
//
// Живой прогон нужен именно здесь: сервер отдаёт 406 объявлений и 78 заявок, а человек
// на экране их не видит. Фикстуры такую пару не воспроизводят по определению — в них
// данные подобраны так, чтобы экран собрался.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { BASE_URL, DESKTOP, openBrowser, resize, waitForVisible } from '../driver'

const API = process.env.E2E_API_URL ?? 'http://localhost:8100/api/v1'

async function adminSession(driver: WebDriver): Promise<void> {
  const answer = await fetch(`${API}/auth/guest/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_id: `console-${Date.now()}` }),
  })
  const { access_token: token } = (await answer.json()) as { access_token: string }
  const { id } = JSON.parse(
    Buffer.from(token.split('.')[1], 'base64').toString('utf8'),
  ) as { id: string }

  const { execSync } = await import('node:child_process')
  execSync(
    `docker compose exec -T postgres psql -U absolute -d absolute -q -c ` +
      `"update users set role='admin', is_guest=false where id='${id}'"`,
    { cwd: '../infra', stdio: 'ignore' },
  )

  await driver.get(`${BASE_URL}/feed`)
  await driver.executeScript(
    `localStorage.setItem('absolute.session', arguments[0])`,
    JSON.stringify({
      accessToken: token,
      refreshToken: token,
      userId: id,
      role: 'admin',
      displayName: 'Проверяющий',
      avatarUrl: null,
    }),
  )
}

describe('Консоль на живых данных', () => {
  let driver: WebDriver

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    await adminSession(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('очередь объявлений наполняется тем, что отдал сервер', async () => {
    await driver.get(`${BASE_URL}/moderation/queue`)

    const list = await waitForVisible(driver, 'moderation-queue')
    expect((await list.getText()).length).toBeGreaterThan(0)
  })

  it('заявки на роль видны модератору', async () => {
    await driver.get(`${BASE_URL}/moderation/supplier-applications`)

    const list = await waitForVisible(driver, 'role-applications')
    expect((await list.getText()).length).toBeGreaterThan(0)
  })
})
