import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { PeoplePage } from '../PeoplePage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия элемента `GET /role/users`.
const person = (id: string, over: Record<string, unknown> = {}) => ({
  id,
  name: 'Анна Петрова',
  role: 'user',
  platform: 'yandex',
  is_blocked: false,
  deleted_at: null,
  created_at: '2026-03-01T10:00:00',
  ...over,
})

let server: FakeServer

function people(total: number, ...items: ReturnType<typeof person>[]) {
  server.on('GET', BACKEND.admin.users, { status: 200, body: { items, total } })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('a1', 'admin')
})
afterEach(resetServer)

// Feature: Люди площадки
describe('страница людей', () => {
  it('Scenario: строка называет роль и вход словами и помечает закрытый доступ и ушедших', async () => {
    // Given Анна вошла через Яндекс, у Олега закрыт доступ, Ира удалила запись
    people(
      3,
      person('u1'),
      person('u2', { name: 'Олег', role: 'importer', platform: 'vk', is_blocked: true }),
      person('u3', { name: null, platform: null, deleted_at: '2026-09-01T00:00:00' }),
    )
    // When администратор открывает людей
    renderPage(<PeoplePage />)
    // Then роли и входы словами, метки доступа и ухода на своих строках
    expect(await screen.findByText('Анна Петрова')).toBeInTheDocument()
    expect(screen.getByText('Яндекс')).toBeInTheDocument()
    expect(screen.getByText('Поставщик')).toBeInTheDocument()
    expect(screen.getAllByTestId('people-blocked')).toHaveLength(1)
    expect(screen.getAllByTestId('people-departed')).toHaveLength(1)
    expect(screen.getByText('Без имени')).toBeInTheDocument()
  })

  it('Scenario: поиск уходит по нажатию «Найти», а не на каждую букву', async () => {
    people(1, person('u1'))
    renderPage(<PeoplePage />)
    await screen.findByText('Анна Петрова')
    const before = server.calls.length

    fireEvent.change(screen.getByTestId('people-search'), { target: { value: ' Анна ' } })
    expect(server.calls.length).toBe(before)
    fireEvent.click(screen.getByRole('button', { name: 'Найти' }))

    await waitFor(() =>
      expect(
        server.calls.some((call) => call.path.includes('query=%D0%90%D0%BD%D0%BD%D0%B0')),
      ).toBe(true),
    )
  })

  it('Scenario: людей больше страницы — «Дальше» открывает вторую', async () => {
    people(45, person('u1'))
    renderPage(<PeoplePage />)

    expect(await screen.findByText('1 из 3')).toBeInTheDocument()
    fireEvent.click(screen.getByTestId('people-next'))

    expect(await screen.findByText('2 из 3')).toBeInTheDocument()
    await waitFor(() =>
      expect(server.calls.some((call) => call.path.includes('page=2'))).toBe(true),
    )
  })

  it('Scenario: никого не нашлось — так и написано', async () => {
    people(0)
    renderPage(<PeoplePage />)

    expect(await screen.findByText('Никого не нашлось')).toBeInTheDocument()
    expect(screen.queryByTestId('people-pager')).toBeNull()
  })

  it('Scenario: список не загрузился — предложение повторить', async () => {
    server.on('GET', BACKEND.admin.users, { status: 500, body: {} })
    renderPage(<PeoplePage />)

    expect(await screen.findByText('Не удалось получить список')).toBeInTheDocument()
  })
})
