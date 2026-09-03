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
  waitForButton,
  waitForVisible,
  waitGone,
} from '../driver'

export class FeedStatements {
  constructor(private readonly driver: WebDriver) {}

  // Единственная разрешённая навигация по адресу — вход в приложение.
  //
  // Вторая попытка — не борьба с мигающим тестом: дев-сервер под прогоном может умереть
  // между файлами сценариев и подняться заново (см. `e2e/serve.ts`), и первый заход в
  // этот момент упирается в отказ соединения.
  async openApp(): Promise<void> {
    await this.openWithRetries(6)
    await waitForVisible(this.driver, 'site-header')
  }

  // Ждём подъёма, а не фиксированную паузу: перезапуск занимает от секунды до десяти,
  // и пауза наугад либо тратит время зря, либо всё равно не дожидается.
  private async openWithRetries(left: number): Promise<void> {
    try {
      await this.driver.get(BASE_URL)
    } catch (error) {
      if (left <= 0) throw error
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await this.openWithRetries(left - 1)
    }
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
    const badges = await this.driver.findElements(
      By.css('[data-testid="listing-card"] [data-badge="thickness"]'),
    )
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

  // Фильтр по марке: список приходит с сервера, выбор попадает на кнопку и в запрос.
  async pickBrandFromFilter(brand: string): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'filter-brand'))
    const sheet = await waitForVisible(this.driver, 'brand-sheet')
    await clickElement(this.driver, await waitForButton(this.driver, sheet, brand))
    await clickElement(this.driver, await waitForButton(this.driver, sheet, 'Все модели'))
    expect(await textOf(this.driver, 'filter-brand')).toContain(brand)
  }

  // Листание проверяется ростом числа карточек, а не адресом страницы: страницы копятся
  // в одной колонке, и подмена показанного была бы видна именно здесь.
  async loadMoreAndAssertGrows(): Promise<void> {
    const before = await this.cardCount()
    await clickElement(this.driver, await waitForVisible(this.driver, 'feed-more'))
    await this.driver.wait(async () => (await this.cardCount()) > before, 8000)
  }

  async sortBy(value: string): Promise<void> {
    const head = await waitForVisible(this.driver, 'feed-head')
    const select = await head.findElement(By.css('select'))
    await select.findElement(By.css(`option[value="${value}"]`)).click()
  }

  async assertPricesAscending(): Promise<void> {
    await this.driver.wait(async () => {
      const prices = await this.prices()
      return prices.length > 1 && prices.every((price, index) => index === 0 || prices[index - 1] <= price)
    }, 8000)
  }

  private async prices(): Promise<number[]> {
    const cells = await this.driver.findElements(By.css('[data-testid="listing-price"]'))
    const texts = await Promise.all(cells.map((cell) => cell.getText()))
    return texts.map((text) => Number(text.replace(/[^0-9]/g, '')))
  }
}
