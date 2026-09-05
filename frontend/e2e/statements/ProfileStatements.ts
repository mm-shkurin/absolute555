// Свой профиль в браузере: имя, фотография, выход.
import type { WebDriver } from 'selenium-webdriver'
import { BASE_URL, clickElement, testId, textOf, waitForVisible } from '../driver'
import { expect } from 'vitest'

export class ProfileStatements {
  constructor(private readonly driver: WebDriver) {}

  async open(): Promise<void> {
    await this.driver.get(`${BASE_URL}/my/profile`)
    await waitForVisible(this.driver, 'profile')
  }

  async rename(name: string): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'profile-name-edit'))
    const input = await waitForVisible(this.driver, 'profile-name-input')
    await input.clear()
    await input.sendKeys(name)
    await clickElement(this.driver, await waitForVisible(this.driver, 'profile-name-save'))
  }

  async assertNameShown(name: string): Promise<void> {
    await this.driver.wait(
      async () => (await textOf(this.driver, 'person-name')).trim() === name,
      5000,
      `имя в шапке профиля не стало «${name}»`,
    )
  }

  // Файл кладётся в поле изнутри браузера: `sendKeys` в собранном приложении принимает
  // путь молча и оставляет поле пустым — то же, на чём споткнулся мастер продажи.
  async pickPhoto(): Promise<void> {
    await waitForVisible(this.driver, 'profile-photo-pick')
    await this.driver.executeScript(`
      const input = document.querySelector('[data-testid="profile-photo-file"]')
      const png = Uint8Array.from(atob(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
      ), (c) => c.charCodeAt(0))
      const data = new DataTransfer()
      data.items.add(new File([png], 'face.png', { type: 'image/png' }))
      input.files = data.files
      input.dispatchEvent(new Event('change', { bubbles: true }))
    `)
  }

  async assertPhotoShown(): Promise<void> {
    await this.driver.wait(
      async () => {
        const shown = await this.driver.findElements(testId('person-avatar'))
        if (!shown.length) return false
        return (await shown[0].getTagName()) === 'img'
      },
      5000,
      'фотография не появилась в шапке профиля',
    )
  }

  async signOut(): Promise<void> {
    await clickElement(this.driver, await waitForVisible(this.driver, 'profile-sign-out'))
  }

  async assertSignedOut(): Promise<void> {
    // Исход выхода — экран для незнакомого посетителя, а не мелькнувший спиннер.
    await waitForVisible(this.driver, 'header-sign-in')
    expect(await textOf(this.driver, 'site-header')).not.toContain('Профиль')
  }
}
