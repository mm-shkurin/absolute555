// Утверждения сквозного каркаса: шапка, нижняя панель телефона, тема.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { isVisible, waitForVisible } from '../driver'

export class NavigationStatements {
  constructor(private readonly driver: WebDriver) {}

  async assertTabBarVisible(visible: boolean): Promise<void> {
    expect(await isVisible(this.driver, 'tab-bar')).toBe(visible)
  }

  async assertHeaderSectionsVisible(visible: boolean): Promise<void> {
    const header = await waitForVisible(this.driver, 'site-header')
    const links = await header.findElements(By.linkText('Под заказ'))
    if (!visible) {
      expect(links.length === 0 || !(await links[0].isDisplayed())).toBe(true)
      return
    }
    expect(await links[0].isDisplayed()).toBe(true)
  }

  async openSectionFromTabBar(label: string): Promise<void> {
    const bar = await waitForVisible(this.driver, 'tab-bar')
    await bar.findElement(By.xpath(`.//a[contains(., "${label}")]`)).click()
  }

  async openImportFeedFromHeader(): Promise<void> {
    await this.driver.findElement(By.linkText('Под заказ')).click()
    await waitForVisible(this.driver, 'import-feed')
  }

  async assertScreenShown(id: string): Promise<void> {
    await waitForVisible(this.driver, id)
  }

  async chooseTheme(theme: 'light' | 'dark'): Promise<void> {
    const toggle = await waitForVisible(this.driver, 'theme-toggle')
    const label = theme === 'light' ? 'Светлая тема' : 'Тёмная тема'
    await toggle.findElement(By.css(`[aria-label="${label}"]`)).click()
  }

  async assertThemeApplied(theme: 'light' | 'dark'): Promise<void> {
    const root = await this.driver.findElement(By.css('html'))
    expect(await root.getAttribute('data-theme')).toBe(theme)
  }

  // Тема — выбор человека, а не настройка вкладки: она обязана пережить перезагрузку,
  // иначе выбор приходится делать заново на каждом экране.
  async reload(): Promise<void> {
    await this.driver.navigate().refresh()
    await waitForVisible(this.driver, 'site-header')
  }

  async assertNoHorizontalScroll(): Promise<void> {
    const overflow = await this.driver.executeScript<number>(
      'return document.documentElement.scrollWidth - document.documentElement.clientWidth',
    )
    // Полоса прокрутки вбок на телефоне означает, что что-то шире экрана: карточка,
    // таблица или схема, вырвавшаяся из своего контейнера.
    expect(overflow).toBeLessThanOrEqual(1)
  }
}
