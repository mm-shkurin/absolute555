import { ROUTES } from '../../../shared/navigation/routes'

export interface SummaryTile {
  label: string
  value: number
  to: string
  hint: string
}

export interface SummaryCounts {
  waiting: number
  complained: number
  handled_today: number
}

export function buildSummaryTiles(counts: SummaryCounts, applications: number): SummaryTile[] {
  return [
    {
      label: 'Ждут проверки',
      value: counts.waiting,
      to: ROUTES.moderationQueue,
      hint: 'Объявления, отправленные продавцами',
    },
    {
      label: 'С жалобами',
      value: counts.complained,
      to: ROUTES.moderationComplaints,
      hint: 'На них пожаловались читатели',
    },
    {
      label: 'Заявки на роль',
      value: applications,
      to: ROUTES.moderationRoles,
      hint: 'Ждут решения',
    },
    {
      label: 'Разобрано сегодня',
      value: counts.handled_today,
      to: ROUTES.moderationQueue,
      hint: 'Уже закрытые за сутки',
    },
  ]
}
