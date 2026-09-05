// Консоль: вход из шапки, сводка, люди, карточка и закрытие доступа (история 23).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { By, type WebDriver } from 'selenium-webdriver'
import {
  BASE_URL,
  DESKTOP,
  clickElement,
  openBrowser,
  resize,
  textOf,
  waitForVisible,
} from '../driver'
import { FeedStatements } from '../statements/FeedStatements'

describe('Консоль модератора', () => {
  let driver: WebDriver

  beforeAll(async () => {
    driver = await openBrowser()
    await resize(driver, DESKTOP)
    await new FeedStatements(driver).openApp()
  })

  afterAll(async () => {
    await driver?.quit()
  })

  it('модератор попадает в консоль из шапки, а не по памяти адреса', async () => {
    await driver.get(`${BASE_URL}/feed`)

    await clickElement(driver, await waitForVisible(driver, 'header-moderation'))

    await waitForVisible(driver, 'admin-summary')
  })

  it('в профиль вынесен вход в кабинет — им и заходят с узкого экрана', async () => {
    // Ссылка в шапке живёт только на десктопе, а профиль открыт с любой ширины: без
    // этого входа модератор с планшета помнил бы адрес наизусть.
    await driver.get(`${BASE_URL}/my/profile`)

    const entry = await waitForVisible(driver, 'profile-moderation')
    expect(await entry.getText()).toContain('Кабинет модератора')

    await clickElement(driver, await entry.findElement(By.xpath('.//a[contains(., "Перейти")]')))
    await waitForVisible(driver, 'admin-summary')
  })

  it('сводка называет, где затор, и ведёт в этот раздел', async () => {
    await driver.get(`${BASE_URL}/moderation`)

    const tiles = await waitForVisible(driver, 'admin-tiles')
    const text = await tiles.getText()
    expect(text).toContain('Ждут проверки')
    expect(text).toContain('С жалобами')

    await clickElement(driver, await tiles.findElement(By.xpath('.//a[contains(., "С жалобами")]')))
    await waitForVisible(driver, 'complaints')
  })

  it('список людей приходит страницей и сужается поиском', async () => {
    await driver.get(`${BASE_URL}/moderation/people`)
    await waitForVisible(driver, 'people-list')

    // Проверяется исход, а не промежуточная стадия: страница уже пришла, и то, что
    // страниц больше одной, видно по самому переключателю.
    const pager = await waitForVisible(driver, 'people-pager')
    expect(await pager.getText()).toContain('из')

    const search = await waitForVisible(driver, 'people-search')
    await search.sendKeys('Пелагея')
    await clickElement(driver, await driver.findElement(By.xpath('//button[contains(., "Найти")]')))

    await driver.wait(async () => {
      const rows = await textOf(driver, 'people-list')
      return rows.includes('Пелагея') && !rows.includes('Игорь')
    }, 5000)
  })

  it('доступ не закрывается, пока не написана причина', async () => {
    await driver.get(`${BASE_URL}/moderation/people/p1`)
    await waitForVisible(driver, 'admin-person')

    await clickElement(driver, await waitForVisible(driver, 'access-open'))
    await clickElement(driver, await waitForVisible(driver, 'access-confirm'))

    // Форма осталась на месте и объяснила, чего не хватает: отказ после нажатия человек
    // читает как поломку, а не как правило.
    expect(await textOf(driver, 'access-reason-error')).toContain('Без причины')
    await waitForVisible(driver, 'access-dialog')

    const reason = await waitForVisible(driver, 'access-reason')
    await reason.sendKeys('объявления с чужими фотографиями')
    await clickElement(driver, await waitForVisible(driver, 'access-confirm'))

    await waitForVisible(driver, 'person-blocked')
  })

  it('закрытому доступ говорят прямо, а не показывают сбой входа', async () => {
    // `as=blocked` заставляет заглушку отвечать тем же отказом, что и сервер: сценарий
    // проходит весь путь, включая перехват в слое запросов.
    await driver.get(`${BASE_URL}/my/profile?as=blocked`)

    const notice = await waitForVisible(driver, 'access-closed')
    const text = await notice.getText()
    expect(text).toContain('Доступ к площадке закрыт')
    expect(text).toContain('объявления с чужими фотографиями')
    expect(text).not.toContain('не хватает прав')
  })

  it('журнал показывает, кто менял роль и по какой причине', async () => {
    // Заблокированная запись заглушки — единственная, у которой журнал не пуст.
    await driver.get(`${BASE_URL}/moderation/people/p5`)

    const journal = await waitForVisible(driver, 'person-journal')
    const text = await journal.getText()
    expect(text).toContain('Доступ закрыт')
    expect(text).toContain('user → manager')
  })
})
