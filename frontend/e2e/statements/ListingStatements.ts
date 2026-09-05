// Утверждения карточки объявления и карты замеров.
import { expect } from 'vitest'
import { By, Key, type WebDriver } from 'selenium-webdriver'
import { clickElement, count, isVisible, testId, textOf, waitForVisible, waitGone } from '../driver'

export class ListingStatements {
  constructor(private readonly driver: WebDriver) {}

  async assertListingShown(): Promise<void> {
    await waitForVisible(this.driver, 'listing')
    await waitForVisible(this.driver, 'gallery')
  }

  async assertPriceShown(): Promise<void> {
    expect(await textOf(this.driver, 'listing-price')).toMatch(/₽$/)
  }

  async assertViewerMode(expected: 'guest' | 'buyer' | 'sold'): Promise<void> {
    const side = await waitForVisible(this.driver, 'listing-side')
    expect(await side.getAttribute('data-mode')).toBe(expected)
  }

  async assertOffersLocked(): Promise<void> {
    await waitForVisible(this.driver, 'offers-locked')
  }

  async assertOffersVisible(): Promise<void> {
    await waitForVisible(this.driver, 'offers')
  }

  async assertOwnerPanelShown(): Promise<void> {
    await waitForVisible(this.driver, 'owner-panel')
  }

  // Решение модератора — история объявления, а не его состояние: бейдж говорит, что
  // объявление опубликовано, эта строка — когда его до этого проверили.
  async assertDecidedByModeratorShown(): Promise<void> {
    const line = await waitForVisible(this.driver, 'listing-decided')
    expect(await line.getText()).toContain('Проверено модератором')
  }

  async openGallery(): Promise<void> {
    const gallery = await waitForVisible(this.driver, 'gallery')
    await clickElement(this.driver, await gallery.findElement(By.css('button')))
    await waitForVisible(this.driver, 'lightbox')
  }

  async closeGalleryWithEscape(): Promise<void> {
    await this.driver.actions().sendKeys(Key.ESCAPE).perform()
    await waitGone(this.driver, 'lightbox')
  }

  async assertGalleryClosed(): Promise<void> {
    expect(await count(this.driver, 'lightbox')).toBe(0)
  }

  async openThicknessMap(): Promise<void> {
    const teaser = await waitForVisible(this.driver, 'thickness-teaser')
    await clickElement(
      this.driver,
      await teaser.findElement(By.xpath('.//a[contains(., "Открыть карту")]')),
    )
    await waitForVisible(this.driver, 'thickness')
  }

  async assertSchematicShown(): Promise<void> {
    await waitForVisible(this.driver, 'body-schematic')
    await waitForVisible(this.driver, 'panel-list')
  }

  async assertNoPanelSelected(): Promise<void> {
    expect(await count(this.driver, 'panel-detail')).toBe(0)
  }

  async selectPanelFromList(panel: string): Promise<void> {
    const list = await waitForVisible(this.driver, 'panel-list')
    await clickElement(this.driver, await list.findElement(By.css(`[data-panel="${panel}"]`)))
    await waitForVisible(this.driver, 'panel-detail')
  }

  async assertPanelDetail(labelFragment: string): Promise<void> {
    const detail = await waitForVisible(this.driver, 'panel-detail')
    expect(await detail.getText()).toContain(labelFragment)
  }

  // Выбор панели подсвечивается и на схеме: одна панель встречается в нескольких
  // проекциях, и тест проверяет именно это — не «класс появился», а «во всех проекциях».
  async assertPanelHighlightedOnSchematic(panel: string, atLeast: number): Promise<void> {
    const highlighted = await this.driver.findElements(
      By.css(`[data-testid="body-schematic"] path[data-panel="${panel}"][data-selected="true"]`),
    )
    expect(highlighted.length).toBeGreaterThanOrEqual(atLeast)
  }

  async assertMobileActionsVisible(visible: boolean): Promise<void> {
    expect(await isVisible(this.driver, 'mobile-actions')).toBe(visible)
  }

  async assertSideColumnVisible(visible: boolean): Promise<void> {
    expect(await isVisible(this.driver, 'listing-side')).toBe(visible)
  }

  async elementExists(id: string): Promise<boolean> {
    return (await this.driver.findElements(testId(id))).length > 0
  }

  // Предложение цены доходит до сервера, и экран говорит об этом словами: молчание после
  // отправки читается как несработавшая кнопка.
  async offerPrice(price: string): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'offer-price'))
    const sheet = await waitForVisible(this.driver, 'offer-sheet')
    const send = await sheet.findElement(testId('offer-send'))
    expect(await send.getAttribute('disabled')).toBeTruthy()
    await (await sheet.findElement(testId('offer-input'))).sendKeys(price)
    await clickElement(this.driver, send)
    expect(await textOf(this.driver, 'offer-sent')).toContain('Предложение отправлено')
  }

  async revealPhone(): Promise<void> {
    const side = await waitForVisible(this.driver, 'listing-side')
    await clickElement(
      this.driver,
      await side.findElement(By.xpath('.//button[contains(., "Показать телефон")]')),
    )
    expect(await textOf(this.driver, 'revealed-phone')).toContain('+7')
  }

  // Гость упирается в стену входа: кнопки на месте, но ведут они не к торгу, а на вход.
  // Проверяется исход — адрес провайдера, — а не то, что кнопка нажалась.
  async assertSignInWallOnOffer(): Promise<void> {
    const side = await waitForVisible(this.driver, 'listing-side')
    await clickElement(this.driver, await side.findElement(By.css('[data-testid="offer-price"]')))
    await this.driver.wait(async () => (await this.driver.getCurrentUrl()).includes('/auth/'), 8000)
  }
}
