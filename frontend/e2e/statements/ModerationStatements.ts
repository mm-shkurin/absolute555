// Утверждения кабинета модератора: очередь, решение по карточке и жалоба покупателя.
import { expect } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import { BASE_URL, clickElement, count, exists, textOf, waitForVisible } from '../driver'

export class ModerationStatements {
  constructor(private readonly driver: WebDriver) {}

  async openQueue(): Promise<void> {
    await this.driver.get(`${BASE_URL}/moderation/queue`)
    await waitForVisible(this.driver, 'moderation-queue')
  }

  async openComplaints(): Promise<void> {
    await this.driver.get(`${BASE_URL}/moderation/complaints`)
    await waitForVisible(this.driver, 'complaints')
  }

  async assertQueueRowsAtLeast(expected: number): Promise<void> {
    await waitForVisible(this.driver, 'queue-row')
    expect(await count(this.driver, 'queue-row')).toBeGreaterThanOrEqual(expected)
  }

  async switchTab(label: string): Promise<void> {
    const tabs = await this.driver.findElement(By.css('[role="tablist"]'))
    await clickElement(
      this.driver,
      await tabs.findElement(By.xpath(`.//button[contains(., "${label}")]`)),
    )
  }

  async assertEmptyExplains(fragment: string): Promise<void> {
    expect(await textOf(this.driver, 'list-empty')).toContain(fragment)
  }

  // Причина обязательна: кнопка отклонения выключена, пока ярлык не выбран, и это
  // единственное, что отличает отправленное решение от случайного нажатия.
  async assertRejectionNeedsReason(): Promise<void> {
    const panel = await waitForVisible(this.driver, 'review-panel')
    await clickElement(
      this.driver,
      await panel.findElement(By.xpath('.//button[contains(., "Отклонить с причиной")]')),
    )
    const form = await waitForVisible(this.driver, 'rejection-form')
    const send = await form.findElement(By.xpath('.//button[contains(., "Отклонить и отправить")]'))
    expect(await send.getAttribute('disabled')).toBeTruthy()
    await clickElement(this.driver, await form.findElement(By.css('[aria-pressed]')))
    expect(await send.getAttribute('disabled')).toBeFalsy()
  }

  async rejectSelected(): Promise<void> {
    const form = await waitForVisible(this.driver, 'rejection-form')
    await clickElement(
      this.driver,
      await form.findElement(By.xpath('.//button[contains(., "Отклонить и отправить")]')),
    )
  }

  async assertNoFailureShown(): Promise<void> {
    expect(await exists(this.driver, 'list-failure')).toBe(false)
  }

  async openUnpublishReasons(): Promise<void> {
    const first = await waitForVisible(this.driver, 'complaint-case')
    await clickElement(
      this.driver,
      await first.findElement(By.xpath('.//button[contains(., "Снять с публикации")]')),
    )
    await waitForVisible(this.driver, 'unpublish-reasons')
  }

  // Жалоба покупателя: причина из списка обязательна, а отправленную жалобу экран
  // подтверждает словами — молчание после нажатия читается как несработавшая кнопка.
  async complainAboutOpenListing(): Promise<void> {
    const side = await waitForVisible(this.driver, 'listing-side')
    await clickElement(this.driver, await side.findElement(By.css('[title="Пожаловаться"]')))
    const sheet = await waitForVisible(this.driver, 'complain-sheet')
    const send = await sheet.findElement(By.xpath('.//button[contains(., "Отправить жалобу")]'))
    expect(await send.getAttribute('disabled')).toBeTruthy()
    await clickElement(
      this.driver,
      await sheet.findElement(By.xpath('.//button[contains(., "Цена-приманка")]')),
    )
    await clickElement(this.driver, send)
    // Проверяется исход, а не форма сразу после клика: ответ сервера приходит позже
    // нажатия, и чтение вслед за ним застаёт ещё не отправленную жалобу.
    expect(await textOf(this.driver, 'complain-done')).toContain('Жалоба отправлена')
  }

  async assertHeaderUnreadShown(): Promise<void> {
    expect(await textOf(this.driver, 'header-unread')).not.toBe('')
  }

  async openRoleRequests(): Promise<void> {
    await this.driver.get(`${BASE_URL}/moderation/supplier-applications`)
    await waitForVisible(this.driver, 'role-applications')
  }

  // Отказ без причины не уходит: сервер отвергает его, и кнопка выключена до текста.
  async assertRejectionNeedsText(): Promise<void> {
    const card = await waitForVisible(this.driver, 'role-application')
    await clickElement(
      this.driver,
      await card.findElement(By.xpath('.//button[contains(., "Отклонить с причиной")]')),
    )
    const form = await waitForVisible(this.driver, 'role-rejection')
    const send = await form.findElement(By.xpath('.//button[contains(., "Отправить отказ")]'))
    expect(await send.getAttribute('disabled')).toBeTruthy()
    await (await form.findElement(By.css('textarea'))).sendKeys('Не хватает описания опыта')
    expect(await send.getAttribute('disabled')).toBeFalsy()
  }

  async assertDecidedTabEmptyExplains(): Promise<void> {
    await this.switchTab('Отклонённые')
    expect(await textOf(this.driver, 'list-empty')).toContain('Отклонённых заявок нет')
  }
}
