// Личные разделы: мастер продажи, торг и переписка.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, PHONE, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { NavigationStatements } from '../statements/NavigationStatements'
import { PersonalStatements } from '../statements/PersonalStatements'

describe('Личные разделы', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let personal: PersonalStatements
  let nav: NavigationStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    personal = new PersonalStatements(driver)
    nav = new NavigationStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('мастер продажи ведёт от снимка СТС к характеристикам', async () => {
    await feed.openApp()
    await personal.startSellingFromHeader()
    await personal.assertWizardStep('step-document')
    await personal.attachDocument()
    // Проверяется исход, а не мелькнувшая по дороге обработка: она длится ровно столько,
    // сколько сервер читает документ, и на быстром ответе её можно не застать вовсе.
    await personal.assertWizardStep('step-specs')
    await personal.assertStepMarkedCurrent(2)
  })

  it('пустое объявление не отправляется на модерацию', async () => {
    await feed.openApp()
    await personal.startSellingFromHeader()
    await personal.attachDocument()
    await personal.assertWizardStep('step-specs')
    await personal.goToNextStep('specs-next')
    await personal.goToNextStep('pricing-next')
    await personal.goToNextStep('photos-next')
    await personal.goToNextStep('thickness-skip')
    await personal.assertWizardStep('step-review')
    await personal.assertSubmitBlocked()
  })

  it('офферы разделены на присланные и отправленные', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await personal.openOffersFromTabBar()
    await personal.assertOfferRowsAtLeast(3)
    await personal.assertExpiredOfferHasNoActions()
    await personal.switchOffersTab('Я отправил')
    await personal.assertOfferRowsAtLeast(4)
    await resize(driver, DESKTOP)
  })

  it('на телефоне переписка открывается вместо списка и возвращается назад', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await nav.openSectionFromTabBar('Чаты')
    await nav.assertScreenShown('chats')
    await personal.assertDialogListVisible(true)
    await personal.assertConversationVisible(false)
    await personal.openFirstDialog()
    await personal.assertConversationVisible(true)
    await personal.assertDialogListVisible(false)
    await personal.goBackToDialogs()
    await personal.assertDialogListVisible(true)
    await resize(driver, DESKTOP)
  })
})
