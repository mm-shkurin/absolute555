// Раскладка на трёх ширинах. Проверяется не «стили применились», а решения шкалы:
// где панель фильтров, откуда навигация и не вылезает ли что-то за экран.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, PHONE, TABLET, openBrowser, resize } from '../driver'
import { FeedStatements } from '../statements/FeedStatements'
import { ListingStatements } from '../statements/ListingStatements'
import { NavigationStatements } from '../statements/NavigationStatements'

describe('Раскладка от десктопа до телефона', () => {
  let driver: WebDriver
  let feed: FeedStatements
  let listing: ListingStatements
  let nav: NavigationStatements

  beforeAll(async () => {
    driver = await openBrowser()
    feed = new FeedStatements(driver)
    listing = new ListingStatements(driver)
    nav = new NavigationStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('на десктопе фильтры сбоку, нижней панели нет', async () => {
    await resize(driver, DESKTOP)
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.assertFilterPanelVisible(true)
    await feed.assertMobileFilterBarVisible(false)
    await nav.assertTabBarVisible(false)
    await nav.assertHeaderSectionsVisible(true)
  })

  it('на планшете фильтры остаются сбоку, разделы — в шапке', async () => {
    await resize(driver, TABLET)
    await feed.openApp()
    await feed.openFeedFromHeader()
    await feed.assertFilterPanelVisible(true)
    await nav.assertTabBarVisible(false)
    await nav.assertHeaderSectionsVisible(true)
    await nav.assertNoHorizontalScroll()
  })

  it('на телефоне фильтры уезжают в шторку, а навигация — вниз', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await feed.assertFilterPanelVisible(false)
    await feed.assertMobileFilterBarVisible(true)
    await nav.assertTabBarVisible(true)
    await nav.assertHeaderSectionsVisible(false)
    await nav.assertNoHorizontalScroll()
  })

  it('шторка фильтров открывается и закрывается кнопкой «Показать»', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await feed.openFilterSheet()
    await feed.applyFiltersFromSheet()
    await feed.assertSheetClosed()
  })

  it('нижняя панель ведёт в разделы', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await nav.openSectionFromTabBar('Офферы')
    await nav.assertScreenShown('offers')
    await nav.openSectionFromTabBar('Чаты')
    await nav.assertScreenShown('chats')
  })

  it('на телефоне карточка отдаёт действия нижней полосе', async () => {
    await resize(driver, PHONE)
    await feed.openApp()
    await feed.assertFeedShown()
    await feed.openFirstCard()
    await listing.assertListingShown()
    await listing.assertMobileActionsVisible(true)
    await nav.assertNoHorizontalScroll()
  })
})
