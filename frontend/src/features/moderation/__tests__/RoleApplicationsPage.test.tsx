import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, screen, waitFor } from '@testing-library/react'
import { RoleApplicationsPage } from '../RoleApplicationsPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

// Копия элемента `GET /role/role-requests`.
const application = (over: Record<string, unknown> = {}) => ({
  id: 'r1',
  user_id: 'u5',
  user_name: 'Игорь',
  requested_role: 'importer',
  reason: 'Везу машины из Японии',
  additional_info: 'Пять лет в деле',
  status: 'pending',
  created_at: '2026-09-12T10:00:00',
  ...over,
})

let server: FakeServer

function applications(...items: ReturnType<typeof application>[]) {
  server.on('GET', BACKEND.role.requests, { status: 200, body: items })
}

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'admin')
})
afterEach(resetServer)

// Feature: Заявки в поставщики
describe('страница заявок на роль', () => {
  it('Scenario: заявка показывает роль словами, зачем и что добавил человек', async () => {
    // Given Игорь просится в поставщики под привоз
    applications(application())
    // When владелец площадки открывает заявки
    renderPage(<RoleApplicationsPage />)
    // Then видны имя, роль словами, причина и слово от себя
    expect(await screen.findByText('Игорь')).toBeInTheDocument()
    expect(screen.getByText('поставщик под привоз')).toBeInTheDocument()
    expect(screen.getByText('Везу машины из Японии')).toBeInTheDocument()
    expect(screen.getByText('Пять лет в деле')).toBeInTheDocument()
  })

  it('Scenario: одобрение выдаёт роль — сервер получает решение', async () => {
    applications(application())
    server.on('PUT', BACKEND.role.answerRequest('r1'), { status: 200, body: {} })
    renderPage(<RoleApplicationsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Одобрить и выдать роль' }))

    await waitFor(() =>
      expect(server.callsTo('PUT', BACKEND.role.answerRequest('r1'))[0]?.body).toEqual({ status: 'approved' }),
    )
  })

  it('Scenario: отказ без текста причины отправить нельзя', async () => {
    applications(application())
    server.on('PUT', BACKEND.role.answerRequest('r1'), { status: 200, body: {} })
    renderPage(<RoleApplicationsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Отклонить с причиной' }))
    const send = screen.getByRole('button', { name: 'Отправить отказ' })
    expect(send).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Причина. Текст увидит заявитель.'), {
      target: { value: 'Нет подтверждения поставок' },
    })
    fireEvent.click(send)

    await waitFor(() =>
      expect(server.callsTo('PUT', BACKEND.role.answerRequest('r1'))[0]?.body).toEqual({
        status: 'rejected',
        review_comment: 'Нет подтверждения поставок',
      }),
    )
  })

  it('Scenario: разобранная заявка показана без кнопок решения', async () => {
    applications(application({ status: 'approved' }))
    renderPage(<RoleApplicationsPage />)

    expect(await screen.findByText('решение принято')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Одобрить и выдать роль', hidden: true })).not.toBeVisible()
  })

  it('Scenario: вкладка без заявок называет, чего нет', async () => {
    applications()
    renderPage(<RoleApplicationsPage />)

    expect(await screen.findByText('Нерешённых заявок нет')).toBeInTheDocument()
  })

  it('Scenario: переход на вкладку одобренных запрашивает у сервера одобренные', async () => {
    applications()
    renderPage(<RoleApplicationsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Одобренные' }))

    await waitFor(() => expect(server.calls.some((call) => call.path.endsWith('?status=approved'))).toBe(true))
  })
})
