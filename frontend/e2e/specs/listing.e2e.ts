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

  it('вошедший покупатель видит цену и продавца', async () => {
    await openListing()
    await listing.assertListingShown()
    await listing.assertViewerMode('buyer')
    await listing.assertPriceShown()
  })

  // Сценарий ждёт своего решения, а не доработки экрана: мокап обещал покупателю чужие
  // предложения («видно, куда идёт торг»), а сервер отдаёт их только владельцу машины —
  // `GET /offer/car/{id}` отвечает NOT_CAR_OWNER. Либо появится обезличенная история цены
  // отдельной ручкой, либо обещание из мокапа снимается.
  it('покупатель предлагает цену и открывает телефон', async () => {
    await openListing()
    await listing.assertListingShown()
    await listing.revealPhone()
    await listing.offerPrice('3500000')
  })

  it.skip('вошедший покупатель видит чужие предложения по цене', async () => {
    await openListing()
    await listing.assertOffersVisible()
  })

  it('галерея открывается на весь экран и закрывается по Escape', async () => {
    await openListing()
    await listing.openGallery()
    await listing.closeGalleryWithEscape()
    await listing.assertGalleryClosed()
  })

  // Карты замеров на сервере нет вовсе — ни ручки, ни поля: история 14. До неё карточка
  // честно не обещает карту, и открывать в этих трёх сценариях нечего.
  it.skip('из карточки открывается карта замеров', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.assertSchematicShown()
  })

  it.skip('панель карты выбирается из списка и подсвечивается на схеме', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.assertNoPanelSelected()
    await listing.selectPanelFromList('hood')
    await listing.assertPanelDetail('Капот')
    // Капот нарисован в трёх проекциях: сбоку, спереди и сверху.
    await listing.assertPanelHighlightedOnSchematic('hood', 3)
  })

  it.skip('незамеренная панель говорит об этом, а не молчит', async () => {
    await openListing()
    await listing.openThicknessMap()
    await listing.selectPanelFromList('door-rr')
    await listing.assertPanelDetail('не замерена')
  })
})
