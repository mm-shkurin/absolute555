import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { screen, within } from '@testing-library/react'
import { AdminSummaryPage } from '../AdminSummaryPage'
import { BACKEND } from '../../../shared/api/backend/paths'
import { ROUTES } from '../../../shared/navigation/routes'
import { renderPage } from '../../../test/renderPage'
import { fakeServer, resetServer, signedIn, type FakeServer } from '../../../test/fakeServer'

let server: FakeServer

beforeEach(() => {
  server = fakeServer()
  signedIn('m1', 'admin')
})
afterEach(resetServer)

function tile(label: string) {
  return screen.getByText(label).closest('a') as HTMLAnchorElement
}

// Feature: Сводка кабинета показывает, куда идти сегодня
describe('сводка модерации', () => {
  it('Scenario: плитки называют числа сервера и ведут в раздел', async () => {
    // Given 7 объявлений ждут, на 2 жалуются, 5 разобрано, одна заявка на роль
    server.on('GET', BACKEND.moderation.counts, { status: 200, body: { waiting: 7, complained: 2, handled_today: 5 } })
    server.on('GET', BACKEND.role.requests, { status: 200, body: [{ id: 'r1', status: 'pending' }] })
    // When модератор открывает кабинет
    renderPage(<AdminSummaryPage />)
    // Then каждое число — ссылка в свой раздел
    await screen.findByTestId('admin-tiles')
    expect(within(tile('Ждут проверки')).getByText('7')).toBeInTheDocument()
    expect(tile('Ждут проверки').getAttribute('href')).toBe(ROUTES.moderationQueue)
    expect(within(tile('С жалобами')).getByText('2')).toBeInTheDocument()
    expect(tile('С жалобами').getAttribute('href')).toBe(ROUTES.moderationComplaints)
    expect(await within(tile('Заявки на роль')).findByText('1')).toBeInTheDocument()
    expect(within(tile('Разобрано сегодня')).getByText('5')).toBeInTheDocument()
  })

  it('Scenario: сводка не загрузилась — модератор видит это и может повторить', async () => {
    server.on('GET', BACKEND.moderation.counts, { status: 500, body: {} })
    renderPage(<AdminSummaryPage />)

    expect(await screen.findByText('Не удалось получить сводку')).toBeInTheDocument()
  })
})
