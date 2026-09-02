// Профиль поставщика: заполнил — отправил — модератор решил (история 16).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { BASE_URL, DESKTOP, clickElement, openBrowser, resize, waitForVisible } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'

describe('Профиль поставщика', () => {
  let driver: WebDriver
  let feed: FeedStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    await feed.openApp()
  })

  afterAll(async () => {
    await driver?.quit()
  })

  async function openProfile(): Promise<void> {
    await driver.get(`${BASE_URL}/my/supplier-profile`)
    await waitForVisible(driver, 'supplier-profile-form')
  }

  it('заполненный профиль уходит в очередь и перестаёт правиться', async () => {
    await openProfile()
    await clickElement(driver, await waitForVisible(driver, 'profile-submit'))
    const status = await waitForVisible(driver, 'profile-status')
    await driver.wait(async () => (await status.getAttribute('data-status')) === 'pending', 5000)
    // Профиль в очереди заморожен: экран показывает это сам, а не отправляет запрос
    // вслепую и объясняет отказом.
    const submit = await waitForVisible(driver, 'profile-submit')
    expect(await submit.getAttribute('disabled')).toBeTruthy()
  })

  it('модератор видит профиль в очереди и не может отклонить его без причины', async () => {
    await driver.get(`${BASE_URL}/moderation/suppliers`)
    const card = await waitForVisible(driver, 'supplier-queue-card')
    const reject = await card.findElement(By.css('[data-testid="supplier-reject"]'))
    expect(await reject.getAttribute('disabled')).toBeTruthy()
    await card.findElement(By.css('[data-testid="supplier-reason"]')).sendKeys('Нет условий')
    await driver.wait(async () => !(await reject.getAttribute('disabled')), 5000)
  })
})
