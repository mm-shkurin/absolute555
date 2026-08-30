// Утверждения ленты: что человек делает на ней и что видит. Тест читается предложениями,
// а локаторы и ожидания живут здесь.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import {
  BASE_URL,
  clickElement,
  count,
  isVisible,
  testId,
  textOf,
  waitForVisible,
  waitGone,
} from '../driver'

export class FeedStatements {
  constructor(private readonly driver: WebDriver) {}

  // Единственная разрешённая навигация по адресу — вход в приложение.
  async openApp(): Promise<void> {
    await this.driver.get(BASE_URL)
    await waitForVisible(this.driver, 'site-header')
  }

  async openFeedFromHeader(): Promise<void> {
    await this.driver.findElement(By.linkText('В наличии')).click()
    await waitForVisible(this.driver, 'feed')
  }

  async assertFeedShown(): Promise<void> {
    await waitForVisible(this.driver, 'feed')
    await waitForVisible(this.driver, 'listing-grid')
  }

  async assertCardsAtLeast(expected: number): Promise<void> {
    await waitForVisible(this.driver, 'listing-card')
    expect(await count(this.driver, 'listing-card')).toBeGreaterThanOrEqual(expected)
  }

  async cardCount(): Promise<number> {
    return count(this.driver, 'listing-card')
  }

  async assertCountLine(fragment: string): Promise<void> {
    expect(await textOf(this.driver, 'feed-count')).toContain(fragment)
  }

  async assertFirstCardHasPriceAndTitle(): Promise<void> {
    const title = await textOf(this.driver, 'listing-title')
    const price = await textOf(this.driver, 'listing-price')
    expect(title.trim().length).toBeGreaterThan(0)
    expect(price).toMatch(/₽$/)
  }

  async openFirstCard(): Promise<void> {
    const card = await waitForVisible(this.driver, 'listing-card')
    await clickElement(this.driver, card)
    await waitForVisible(this.driver, 'listing')
  }

  async filterByThicknessMap(): Promise<void> {
    const before = await this.cardCount()
    // Кликаем по подписи, а не по самому чекбоксу: он визуально скрыт под переключателем,
    // и человек тоже нажимает именно подпись.
    await clickElement(this.driver, await waitForVisible(this.driver, 'filter-thickness-toggle'))
    await this.driver.wait(async () => (await this.cardCount()) !== before, 8000)
  }

  async assertEveryCardHasThicknessBadge(): Promise<void> {
    const badges = await this.driver.findElements(By.css('[data-testid="listing-card"] [data-badge="thickness"]'))
    expect(badges.length).toBe(await this.cardCount())
  }

  async assertEmptyFeedOffersReset(): Promise<void> {
    const empty = await waitForVisible(this.driver, 'feed-empty')
    expect(await empty.getAttribute('data-kind')).toBe('filtered')
  }

  async assertFilterPanelVisible(visible: boolean): Promise<void> {
    expect(await isVisible(this.driver, 'filter-panel')).toBe(visible)
  }

  async assertMobileFilterBarVisible(visible: boolean): Promise<void> {
    expect(await isVisible(this.driver, 'mobile-filters')).toBe(visible)
  }

  async openFilterSheet(): Promise<void> {
    const bar = await waitForVisible(this.driver, 'mobile-filters')
    await bar.findElement(By.xpath('.//button[normalize-space()="Фильтры"]')).click()
    await waitForVisible(this.driver, 'filter-sheet')
  }

  // Кнопку ищем внутри шторки: боковая панель на телефоне спрятана стилями, но остаётся
  // в разметке, и её кнопка «Показать» — первая в документе.
  async applyFiltersFromSheet(): Promise<void> {
    const sheet = await waitForVisible(this.driver, 'filter-sheet')
    await clickElement(this.driver, await sheet.findElement(testId('filter-apply')))
    await waitGone(this.driver, 'filter-sheet')
  }

  async assertSheetClosed(): Promise<void> {
    expect(await count(this.driver, 'filter-sheet')).toBe(0)
  }

  async setMaxPrice(value: string): Promise<void> {
    const input = await this.driver.findElement(testId('filter-price-to'))
    await input.clear()
    await input.sendKeys(value)
    await this.driver.sleep(500)
  }
}
