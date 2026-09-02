// Утверждения экрана, где продавец заполняет карту замеров.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { BASE_URL, clickElement, textOf, waitForVisible } from '../driver'

export class ThicknessSellerStatements {
  constructor(private readonly driver: WebDriver) {}

  async openFillingScreen(saleCarId: string): Promise<void> {
    await this.driver.get(`${BASE_URL}/sell/${saleCarId}/thickness`)
    await waitForVisible(this.driver, 'thickness-seller')
    await waitForVisible(this.driver, 'panel-list')
  }

  async assertCoverage(expected: string): Promise<void> {
    expect(await textOf(this.driver, 'thickness-coverage')).toBe(expected)
  }

  async selectPanel(panel: string): Promise<void> {
    const list = await waitForVisible(this.driver, 'panel-list')
    await clickElement(this.driver, await list.findElement(By.css(`[data-panel="${panel}"]`)))
    await waitForVisible(this.driver, 'panel-editor')
  }

  // Файл кладётся изнутри браузера: `sendKeys` в собранном приложении принимает путь
  // молча и оставляет поле пустым.
  async attachDevicePhoto(): Promise<void> {
    await this.driver.executeScript(`
      const input = document.querySelector('[data-testid="panel-photo"]')
      const png = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      ), (c) => c.charCodeAt(0))
      const data = new DataTransfer()
      data.items.add(new File([png], 'device.png', { type: 'image/png' }))
      input.files = data.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    `)
  }

  async typeValue(value: string): Promise<void> {
    const field = await waitForVisible(this.driver, 'panel-value')
    await field.clear()
    await field.sendKeys(value)
  }

  async save(): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'panel-save'))
  }

  async assertPanelMeasured(panel: string): Promise<void> {
    const list = await waitForVisible(this.driver, 'panel-list')
    const row = await list.findElement(By.css(`[data-panel="${panel}"]`))
    await this.driver.wait(async () => (await row.getText()).includes('мкм'), 5000)
  }

  async assertRefused(fragment: string): Promise<void> {
    expect(await textOf(this.driver, 'panel-refused')).toContain(fragment)
  }

  async assertPanelValue(panel: string, expected: string): Promise<void> {
    const list = await waitForVisible(this.driver, 'panel-list')
    const row = await list.findElement(By.css(`[data-panel="${panel}"]`))
    // Ожидание исхода, а не промежуточной стадии: строка обновится, когда карта
    // перечитана, и «сохраняем» этого не переживёт.
    await this.driver.wait(async () => (await row.getText()).includes(expected), 5000)
  }
}
