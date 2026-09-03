// Публичные страницы: продавец с отзывами (история 12) и очередь заявок на роль (13).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import {
  BASE_URL,
  DESKTOP,
  clickElement,
  openBrowser,
  resize,
  waitForButton,
  waitForVisible,
} from '../driver'
import { FeedStatements } from '../statements/FeedStatements'

describe('Публичный профиль продавца', () => {
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

  it('страница продавца показывает оценку, отзывы и его объявления', async () => {
    await driver.get(`${BASE_URL}/sellers/u9`)
    await waitForVisible(driver, 'seller-profile')
    const reviews = await waitForVisible(driver, 'seller-reviews')
    expect(await reviews.getText()).toContain('Отзыв')
    await waitForVisible(driver, 'listing-grid')
  })

  it('гость читает профиль продавца: он публичный, как и лента', async () => {
    await feed.openAppAsGuest()
    await driver.get(`${BASE_URL}/sellers/u9`)
    await waitForVisible(driver, 'seller-profile')
    await waitForVisible(driver, 'seller-reviews')
    await feed.leaveGuestMode()
  })

  it('модератор разбирает заявку на роль и не отклоняет её молча', async () => {
    await driver.get(`${BASE_URL}/moderation/supplier-applications`)
    const page = await waitForVisible(driver, 'role-applications')
    // Ждём саму кнопку, а не экран: `role-applications` появляется вместе со скелетоном,
    // и заявки в этот момент ещё едут.
    const reject = await waitForButton(driver, page, 'Отклонить с причиной')
    await clickElement(driver, reject)
    // Отказ раскрывает поле причины: заявитель должен понять, что исправить.
    await waitForVisible(driver, 'role-rejection')
  })
})
