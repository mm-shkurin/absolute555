// Утверждения личных разделов: мастер продажи, офферы, чаты, свои объявления.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { clickElement, count, isVisible, testId, waitForVisible } from '../driver'

export class PersonalStatements {
  constructor(private readonly driver: WebDriver) {}

  async startSellingFromHeader(): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'header-sell'))
    await waitForVisible(this.driver, 'selling')
  }

  async assertWizardStep(testIdName: string): Promise<void> {
    await waitForVisible(this.driver, testIdName)
  }

  async attachDocument(): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'document-continue'))
  }

  async finishRecognition(): Promise<void> {
    const card = await waitForVisible(this.driver, 'step-document-recognizing')
    await clickElement(this.driver, await card.findElement(By.xpath('.//button[normalize-space()="Готово"]')))
  }

  async goToNextStep(button: string): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, button))
  }

  async assertStepMarkedCurrent(number: number): Promise<void> {
    const steps = await waitForVisible(this.driver, 'wizard-steps')
    const current = await steps.findElement(By.css('[aria-current="true"]'))
    expect(await current.getText()).toContain(String(number))
  }

  async assertSubmitBlocked(): Promise<void> {
    const submit = await waitForVisible(this.driver, 'submit-listing')
    expect(await submit.getAttribute('disabled')).toBeTruthy()
  }

  async openOffersFromTabBar(): Promise<void> {
    const bar = await waitForVisible(this.driver, 'tab-bar')
    await clickElement(this.driver, await bar.findElement(By.xpath('.//a[contains(., "Офферы")]')))
    await waitForVisible(this.driver, 'offers')
  }

  async switchOffersTab(label: string): Promise<void> {
    const page = await waitForVisible(this.driver, 'offers')
    await clickElement(
      this.driver,
      await page.findElement(By.xpath(`.//button[contains(., "${label}")]`)),
    )
  }

  async assertOfferRowsAtLeast(expected: number): Promise<void> {
    await waitForVisible(this.driver, 'offer-row')
    expect(await count(this.driver, 'offer-row')).toBeGreaterThanOrEqual(expected)
  }

  // Закончившийся оффер не предлагает решений: у истёкшего нет ни «принять», ни «отклонить».
  async assertExpiredOfferHasNoActions(): Promise<void> {
    const rows = await this.driver.findElements(testId('offer-row'))
    const texts = await Promise.all(rows.map((row) => row.getText()))
    const expired = rows.filter((_, index) => texts[index].includes('истёк'))
    expect(expired.length).toBeGreaterThan(0)
    const buttons = await Promise.all(expired.map((row) => row.findElements(By.css('button'))))
    expect(buttons.flat().length).toBe(0)
  }

  // Ожидание, а не мгновенная проверка: список приходит с сервера, и «не видно» сразу
  // после перехода означает «ещё грузится», а не «сломано».
  async assertDialogListVisible(visible: boolean): Promise<void> {
    if (visible) await waitForVisible(this.driver, 'dialog-list')
    expect(await isVisible(this.driver, 'dialog-list')).toBe(visible)
  }

  async assertConversationVisible(visible: boolean): Promise<void> {
    if (visible) await waitForVisible(this.driver, 'conversation')
    expect(await isVisible(this.driver, 'conversation')).toBe(visible)
  }

  async openFirstDialog(): Promise<void> {
    const list = await waitForVisible(this.driver, 'dialog-list')
    await clickElement(this.driver, await list.findElement(By.css('button')))
  }

  async goBackToDialogs(): Promise<void> {
    const conversation = await waitForVisible(this.driver, 'conversation')
    await clickElement(
      this.driver,
      await conversation.findElement(By.css('[aria-label="К диалогам"]')),
    )
  }
}
