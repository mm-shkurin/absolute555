// Карточка объявления и карта замеров — то, ради чего человек и приходит на площадку.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { ListingStatements } from '../statements/ListingStatements'

describe('Карточка объявления', () => {
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

  async function openListing(): Promise<void> {
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.openFirstCard()
  }

  it('вошедший покупатель видит цену, торг и продавца', async () => {
    await openListing()
    await listing.assertListingShown()
    await listing.assertViewerMode('buyer')
    await listing.assertOffersVisible()
  })

  it('галерея открывается на весь экран и закрывается по Escape', async () => {
    await openListing()
    await listing.openGallery()
    await listing.closeGalleryWithEscape()
    await listing.assertGalleryClosed()
  })

  it('из карточки открывается карта замеров', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.assertSchematicShown()
  })

  it('панель карты выбирается из списка и подсвечивается на схеме', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.assertNoPanelSelected()
    await listing.selectPanelFromList('hood')
    await listing.assertPanelDetail('Капот')
    // Капот нарисован в трёх проекциях: сбоку, спереди и сверху.
    await listing.assertPanelHighlightedOnSchematic('hood', 3)
  })

  it('незамеренная панель говорит об этом, а не молчит', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.selectPanelFromList('door-rr')
    await listing.assertPanelDetail('не замерена')
  })
})
