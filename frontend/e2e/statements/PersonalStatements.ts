// Утверждения личных разделов: мастер продажи, офферы, чаты, свои объявления.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { clickElement, count, exists, isVisible, testId, waitForVisible } from '../driver'

export class PersonalStatements {
  constructor(private readonly driver: WebDriver) {}

  async startSellingFromHeader(): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'header-sell'))
    await waitForVisible(this.driver, 'selling')
  }

  async assertWizardStep(testIdName: string): Promise<void> {
    await waitForVisible(this.driver, testIdName)
  }

  // Снимок кладётся в поле изнутри браузера, а не драйвером.
  //
  // `sendKeys` на поле файла работает не везде одинаково: в собранном приложении Chrome
  // принимал путь молча и оставлял `files` пустым, а шаг — на месте. Здесь же собирается
  // настоящий `File` и рассылается то же событие `change`, которое пришло бы от выбора
  // руками; проверяется ровно то, ради чего сценарий и написан: что делает мастер, когда
  // снимок выбран.
  async attachDocument(): Promise<void> {
    await waitForVisible(this.driver, 'document-continue')
    await this.driver.executeScript(`
      const input = document.querySelector('[data-testid="document-file"]')
      const png = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      ), (c) => c.charCodeAt(0))
      const data = new DataTransfer()
      data.items.add(new File([png], 'sts.png', { type: 'image/png' }))
      input.files = data.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    `)
  }

  // История 20: пометку получают только поля, чей источник назвал сервер. Утверждение
  // читает подписи с пометкой целиком — так видно и лишнюю пометку, и пропавшую.
  async assertRecognizedFields(labels: string[]): Promise<void> {
    const step = await waitForVisible(this.driver, 'step-specs')
    const tagged = await step.findElements(
      By.xpath('.//span[span[contains(text(), "заполнило приложение")]]'),
    )
    const texts = await Promise.all(tagged.map((element) => element.getText()))
    const names = texts.map((text) => text.replace('заполнило приложение', '').trim())
    expect(names.toSorted()).toEqual(labels.toSorted())
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

  // Ответ на предложение уходит на сервер: строка перечитывается, и экран не показывает
  // отказ. Проверяется исход, а не то, что кнопка нажалась.
  async answerFirstOffer(label: string): Promise<void> {
    const row = await waitForVisible(this.driver, 'offer-row')
    await clickElement(this.driver, await row.findElement(By.xpath(`.//button[contains(., "${label}")]`)))
    expect(await exists(this.driver, 'list-failure')).toBe(false)
  }

  // Отзыв пишется по своей сделке: оценка обязательна, без неё кнопка выключена.
  async assertReviewNeedsRating(): Promise<void> {
    // Список приезжает после переключения вкладки: искать кнопку сразу значит искать её
    // в предыдущей выдаче.
    await waitForVisible(this.driver, 'offer-row')
    const reviewable = await this.driver.wait(async () => {
      const rows = await this.driver.findElements(testId('offer-row'))
      const perRow = await Promise.all(
        rows.map((row) => row.findElements(By.xpath('.//button[contains(., "отзыв")]'))),
      )
      return perRow.flat()[0] ?? null
    }, 10_000)
    {
      await clickElement(this.driver, reviewable)
      const sheet = await waitForVisible(this.driver, 'review-sheet')
      const send = await sheet.findElement(By.xpath('.//button[contains(., "отзыв")]'))
      expect(await send.getAttribute('disabled')).toBeTruthy()
      await clickElement(this.driver, await sheet.findElement(By.css('[aria-pressed]')))
      expect(await send.getAttribute('disabled')).toBeFalsy()
    }
  }
}
