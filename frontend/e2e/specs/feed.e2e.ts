// Лента: что покупатель видит, придя на площадку, и что делает фильтр.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { ListingStatements } from '../statements/ListingStatements'

describe('Лента объявлений', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let listing: ListingStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    feed = new FeedStatements(driver)
    listing = new ListingStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('показывает объявления карточками с ценой и названием', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.assertFeedShown()
    await feed.assertCardsAtLeast(4)
    await feed.assertFirstCardHasPriceAndTitle()
    await feed.assertCountLine('объявлен')
  })

  it('фильтр «с картой замеров» оставляет только машины с картой', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.assertFilterPanelVisible(true)
    await feed.filterByThicknessMap()
    await feed.assertEveryCardHasThicknessBadge()
  })

  it('слишком узкие условия объясняют себя, а не показывают пустоту', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.setMaxPrice('1')
    await feed.assertEmptyFeedOffersReset()
  })

  it('щелчок по карточке открывает объявление', async () => {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.openFirstCard()
    await listing.assertListingShown()
    await listing.assertPriceShown()
  })
})
