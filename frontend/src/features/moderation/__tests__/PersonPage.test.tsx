import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { PersonPage } from '../PersonPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия `GET /role/users/{id}`.
const card = (over: Record<string, unknown> = {}) => ({
  id: 'u5',
  name: 'Олег',
  role: 'user',
  platform: 'vk',
  is_blocked: false,
  blocked_reason: null,
  deleted_at: null,
  created_at: '2026-03-01T10:00:00',
  listings_total: 4,
  complaints_total: 2,
  ...over,
})

let server: FakeServer

function open(role: 'admin' | 'manager' = 'admin') {
  signedIn('a1', role)
  return renderPage(<PersonPage />, { at: '/p/u5', route: '/p/:userId' })
}

beforeEach(() => {
  server = fakeServer()
  server.on('GET', BACKEND.admin.userAudit('u5'), { status: 200, body: [] })
})
afterEach(resetServer)

// Feature: Карточка человека и доступ
describe('карточка человека', () => {
  it('Scenario: карточка называет роль, вход, число объявлений и жалоб', async () => {
    // Given у Олега 4 объявления и 2 жалобы
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    // When администратор открывает его карточку
    open()
    // Then видны имя, роль с входом и оба числа
    expect(await screen.findByRole('heading', { name: 'Олег' })).toBeInTheDocument()
    expect(screen.getByText('Пользователь, VK')).toBeInTheDocument()
    expect(screen.getByTestId('person-listings').textContent).toBe('4')
    expect(screen.getByTestId('person-complaints').textContent).toBe('2')
  })

  it('Scenario: закрыть доступ без причины нельзя — экран просит причину до запроса', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    open()

    fireEvent.click(await screen.findByTestId('access-open'))
    fireEvent.click(screen.getByTestId('access-confirm'))

    expect(screen.getByTestId('access-reason-error').textContent).toBe('Без причины нельзя: её увидит тот, кого это касается.')
    expect(server.callsTo('POST', BACKEND.admin.blockUser('u5'))).toEqual([])
  })

  it('Scenario: доступ закрыт с причиной — причина уходит на сервер', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    server.on('POST', BACKEND.admin.blockUser('u5'), { status: 200, body: { is_blocked: true } })
    open()

    fireEvent.click(await screen.findByTestId('access-open'))
    fireEvent.change(screen.getByTestId('access-reason'), { target: { value: '  Мошенничество с ценой ' } })
    fireEvent.click(screen.getByTestId('access-confirm'))

    await waitFor(() =>
      expect(server.callsTo('POST', BACKEND.admin.blockUser('u5'))[0]?.body).toEqual({ reason: 'Мошенничество с ценой' }),
    )
  })

  it('Scenario: у закрытого доступа видна причина и кнопка «Вернуть доступ»', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card({ is_blocked: true, blocked_reason: 'Спам' }) })
    open()

    expect((await screen.findByTestId('person-blocked')).textContent).toBe('Доступ закрыт: Спам')
    expect(screen.getByTestId('access-open').textContent).toBe('Вернуть доступ')
  })

  it('Scenario: сервер отказал в действии — модератор видит, что запись не в его власти', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    server.on('POST', BACKEND.admin.blockUser('u5'), { status: 403, body: { code: 'ROLE_ABOVE_REVIEWER' } })
    open('manager')

    fireEvent.click(await screen.findByTestId('access-open'))
    fireEvent.change(screen.getByTestId('access-reason'), { target: { value: 'Спам' } })
    fireEvent.click(screen.getByTestId('access-confirm'))

    expect(await screen.findByTestId('access-failed')).toBeInTheDocument()
  })

  it('Scenario: журнал действий виден администратору', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    server.on('GET', BACKEND.admin.userAudit('u5'), {
      status: 200,
      body: [{ id: 'e1', action: 'blocked', actor_name: 'Админ', reason: 'Спам', details: null, created_at: '2026-09-01T10:00:00' }],
    })
    open()

    expect(await screen.findByText('Доступ закрыт')).toBeInTheDocument()
    expect(screen.getByText('Спам')).toBeInTheDocument()
  })

  it('Scenario: модератору журнал не показывается', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card() })
    open('manager')

    await screen.findByRole('heading', { name: 'Олег' })
    expect(screen.queryByText('Журнал')).toBeNull()
  })

  it('Scenario: ушедший человек помечен, закрывать нечего', async () => {
    server.on('GET', BACKEND.admin.user('u5'), { status: 200, body: card({ deleted_at: '2026-09-01T00:00:00' }) })
    open()

    expect(await screen.findByTestId('person-departed')).toBeInTheDocument()
  })
})
