// Кабинет модератора и жалоба покупателя: решения, у которых есть последствия. Проверяется
// то, что решение уходит на сервер и экран об этом говорит, а не то, что кнопка нажимается.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { ModerationStatements } from '../statements/ModerationStatements'

describe('Модерация', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let moderation: ModerationStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    moderation = new ModerationStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('объявление отклоняется только с причиной', async () => {
    await feed.openApp()
    await moderation.openQueue()
    await moderation.assertQueueRowsAtLeast(1)
    await moderation.assertRejectionNeedsReason()
    await moderation.rejectSelected()
    await moderation.assertNoFailureShown()
  })

  it('пустая вкладка говорит, чего на ней нет', async () => {
    await feed.openApp()
    await moderation.openQueue()
    await moderation.switchTab('Проверенные сегодня')
    await moderation.assertEmptyExplains('не всей команды, а ваши')
  })

  it('снятие с публикации спрашивает, за что', async () => {
    await feed.openApp()
    await moderation.openComplaints()
    await moderation.openUnpublishReasons()
  })

  it('покупатель жалуется на объявление, выбрав причину', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.openFirstCard()
    await moderation.complainAboutOpenListing()
  })

  it('шапка показывает непрочитанные на широком экране', async () => {
    await feed.openApp()
    await moderation.assertHeaderUnreadShown()
  })
})
