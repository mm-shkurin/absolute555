// Сквозной каркас: тема, переход между каналами, разделы модерации.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { NavigationStatements } from '../statements/NavigationStatements'

describe('Каркас приложения', () => {
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

  it('выбранная тема переживает перезагрузку', async () => {
    await feed.openApp()
    await nav.chooseTheme('dark')
    await nav.assertThemeApplied('dark')
    await nav.reload()
    await nav.assertThemeApplied('dark')
    await nav.chooseTheme('light')
    await nav.assertThemeApplied('light')
  })

  it('из ленты в наличии переходят к ленте под заказ', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await nav.openImportFeedFromHeader()
    await nav.assertScreenShown('import-kinds')
  })
})
