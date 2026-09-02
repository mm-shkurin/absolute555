// Заявка покупателя и отклик поставщика — обратный аукцион (история 18).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { BASE_URL, DESKTOP, clickElement, openBrowser, resize, waitForVisible } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'

describe('Заявка на привоз', () => {
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

  it('заявка открывается и показывает пришедший отклик ценой и сроком', async () => {
    await driver.get(`${BASE_URL}/import-requests/r1`)
    await waitForVisible(driver, 'import-request')
    const bids = await waitForVisible(driver, 'bid-list')
    const text = await bids.getText()
    expect(text).toContain('под ключ')
    expect(text).toContain('400')
  })

  it('автор закрывает свою заявку, и она перестаёт быть активной', async () => {
    await driver.get(`${BASE_URL}/import-requests/r1`)
    await clickElement(driver, await waitForVisible(driver, 'close-request'))
    const specs = await waitForVisible(driver, 'import-request')
    await driver.wait(async () => (await specs.getText()).includes('закрыта'), 5000)
  })

  it('форма новой заявки не отпускает без марки, модели и бюджета', async () => {
    await driver.get(`${BASE_URL}/import-requests/new`)
    const publish = await waitForVisible(driver, 'publish-request')
    expect(await publish.getAttribute('disabled')).toBeTruthy()
    const form = await waitForVisible(driver, 'request-form')
    expect(await form.getText()).toContain('Не хватает')
    // Список марок приходит справочником: свободный текст сервер не примет — он ждёт
    // идентификаторы.
    await waitForVisible(driver, 'request-budget')
    expect(await form.findElements(By.css('select'))).toHaveLength(2)
  })
})
