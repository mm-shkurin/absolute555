// Продавец заполняет карту замеров: снимок экрана прибора плюс число, панель за панелью.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { ThicknessSellerStatements } from '../statements/ThicknessSellerStatements'

describe('Заполнение карты замеров', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let filling: ThicknessSellerStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    filling = new ThicknessSellerStatements(driver)
    // Сессия заводится на первом открытии приложения; экран заполнения без неё
    // отвечает «войдите заново».
    await feed.openApp()
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('замер с фотографией и числом появляется на карте', async () => {
    await filling.openFillingScreen('l4')
    await filling.assertCoverage('0 из 13')
    await filling.selectPanel('hood')
    await filling.attachDevicePhoto()
    await filling.typeValue('96')
    await filling.save()
    await filling.assertPanelValue('hood', '96 мкм')
    await filling.assertCoverage('1 из 13')
  })

  it('замер без фотографии не уходит запросом', async () => {
    await filling.openFillingScreen('l5')
    await filling.selectPanel('roof')
    await filling.typeValue('120')
    await filling.save()
    await filling.assertRefused('фотография')
    await filling.assertCoverage('0 из 13')
  })
})
