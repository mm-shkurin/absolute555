// Канал «под привоз»: те же объявления, другой канал поставки (история 17).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize, waitForVisible } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { NavigationStatements } from '../statements/NavigationStatements'

describe('Лента под привоз', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let nav: NavigationStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    nav = new NavigationStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('привозная карточка называет канал, страну и цену под ключ', async () => {
    await feed.openApp()
    await nav.openImportFeedFromHeader()
    const grid = await waitForVisible(driver, 'listing-grid')
    const badges = await grid.findElements(By.css('[data-badge="import"]'))
    expect(badges.length).toBeGreaterThan(0)
    const turnkey = await grid.findElements(By.css('[data-testid="listing-turnkey"]'))
    expect(turnkey.length).toBeGreaterThan(0)
    expect(await turnkey[0].getText()).toContain('под ключ')
  })

  it('в ленте машин в наличии привоза нет: канал выбирает выдача, а не экран', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    const grid = await waitForVisible(driver, 'listing-grid')
    expect(await grid.findElements(By.css('[data-badge="import"]'))).toHaveLength(0)
  })
})
