// Свой профиль: имя, фотография, выход.
//
// История 21. До неё экран честно писал, что имя и аватар пришли от провайдера входа, а
// кнопка «Выйти» вызывала обработчик, который никто не передавал — клик не делал ничего.
import { afterAll, beforeAll, describe, it } from 'vitest'
import type { WebDriver } from 'selenium-webdriver'
import { DESKTOP, openBrowser, resize } from '../driver'
import { ProfileStatements } from '../statements/ProfileStatements'

describe('Свой профиль', () => {
  let driver: WebDriver
  let profile: ProfileStatements

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    profile = new ProfileStatements(driver)
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('имя, вписанное человеком, встаёт в шапку профиля', async () => {
    await profile.open()

    await profile.rename('Пётр Кузнецов')

    // Проверяется исход, а не то, что форма закрылась: имя показывает сервер, и экран
    // обязан перечитать его, а не оставить у себя набранное.
    await profile.assertNameShown('Пётр Кузнецов')
  })

  it('выбранная фотография занимает место серого круга', async () => {
    await profile.open()

    await profile.pickPhoto()

    await profile.assertPhotoShown()
  })

  it('выход возвращает приложение к незнакомому посетителю', async () => {
    await profile.open()

    await profile.signOut()

    await profile.assertSignedOut()
  })
})
