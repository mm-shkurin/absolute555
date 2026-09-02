// Заявка на роль. Сервер принимает два текста — зачем и что человек добавил от себя, —
// и больше в ней ничего нет: страны, марки, сроки и предоплата принадлежат профилю
// поставщика (история 16), который заполняют уже после одобрения.
export interface RoleRequestDraft {
  reason: string
  about: string
}

export const emptyRoleRequestDraft: RoleRequestDraft = { reason: '', about: '' }

// Заявка без рассказа не рассматривается вовсе: документы площадка не проверяет, и
// решение принимается по тому, что человек о себе сказал.
const ENOUGH_ABOUT = 40

export function missingForRoleRequest(draft: RoleRequestDraft): string[] {
  const gaps: string[] = []
  if (!draft.reason.trim()) gaps.push('зачем вам роль')
  if (draft.about.trim().length < ENOUGH_ABOUT) gaps.push('рассказ об опыте')
  return gaps
}
