// Браузер для сценариев. Один на файл тестов: запуск Chrome стоит секунды, и поднимать
// его на каждый сценарий значит платить их десятками за прогон.
//
// Драйвер скачивает Selenium Manager сам — отдельного chromedriver в зависимостях нет
// намеренно: его версию пришлось бы держать в шаге с браузером разработчика вручную.
import { Builder, By, until, type WebDriver, type WebElement } from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome'

export const BASE_URL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174'

// Три ширины из шкалы `styles/breakpoints.css`: десктоп, планшет в портрете, телефон.
// Раскладка на них разная не косметически, а структурно, поэтому проверяется каждая.
export const DESKTOP = { width: 1440, height: 900 }
export const TABLET = { width: 820, height: 1180 }
export const PHONE = { width: 390, height: 844 }

const WAIT_MS = 8000

export async function openBrowser(): Promise<WebDriver> {
  const options = new Options()
  // Без окна: прогон идёт в CI и в фоне у разработчика, а видимое окно ворует фокус
  // посреди работы.
  if (process.env.E2E_HEADED !== '1') options.addArguments('--headless=new')
  options.addArguments('--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage')
  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build()
  await driver.manage().setTimeouts({ implicit: 0 })
  return driver
}

export async function resize(
  driver: WebDriver,
  size: { width: number; height: number },
): Promise<void> {
  await driver
    .manage()
    .window()
    .setRect({ ...size, x: 0, y: 0 })
}

// Локатор всегда по data-testid: классы генерируются CSS-модулями и меняются от каждой
// правки стилей, а тег — от каждой правки разметки.
export function testId(id: string): By {
  return By.css(`[data-testid="${id}"]`)
}

export async function waitFor(driver: WebDriver, id: string): Promise<WebElement> {
  return driver.wait(until.elementLocated(testId(id)), WAIT_MS)
}

export async function waitForVisible(driver: WebDriver, id: string): Promise<WebElement> {
  const element = await waitFor(driver, id)
  await driver.wait(until.elementIsVisible(element), WAIT_MS)
  return element
}

export async function waitGone(driver: WebDriver, id: string): Promise<void> {
  await driver.wait(async () => (await driver.findElements(testId(id))).length === 0, WAIT_MS)
}

export async function count(driver: WebDriver, id: string): Promise<number> {
  return (await driver.findElements(testId(id))).length
}

export async function exists(driver: WebDriver, id: string): Promise<boolean> {
  return (await count(driver, id)) > 0
}

export async function isVisible(driver: WebDriver, id: string): Promise<boolean> {
  const elements = await driver.findElements(testId(id))
  if (elements.length === 0) return false
  return elements[0].isDisplayed()
}

export async function textOf(driver: WebDriver, id: string): Promise<string> {
  return (await waitForVisible(driver, id)).getText()
}

// Клик с прокруткой к центру экрана. Две причины, обе неочевидные: обычный `click()`
// подводит элемент к верхней кромке, где его перекрывает липкая шапка; а у страницы
// `scroll-behavior: smooth`, поэтому прокрутка длится кадры, и клик без ожидания приходит
// по старым координатам. Отсюда `behavior: instant` и проверка, что элемент уже в кадре.
export async function clickElement(driver: WebDriver, element: WebElement): Promise<void> {
  await driver.executeScript(
    'arguments[0].scrollIntoView({ block: "center", inline: "center", behavior: "instant" })',
    element,
  )
  await driver.wait(async () => inViewport(driver, element), 4000)
  await element.click()
}

async function inViewport(driver: WebDriver, element: WebElement): Promise<boolean> {
  return driver.executeScript<boolean>(
    'const r = arguments[0].getBoundingClientRect();' +
      'return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth',
    element,
  )
}
