// Люди: кто есть на площадке. Страницей, а не списком целиком — сервер отдаёт страницу
// намеренно, и «показать всех» здесь означало бы прочитать всю базу ради одного экрана.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageHeading, PageSection } from '../../shared/ui/PageHeading'
import { EmptyNotice, FailureNotice, ListSkeleton } from '../../shared/ui/ListStates'
import { Button } from '../../shared/ui/Button'
import { ROUTES } from '../../shared/navigation/routes'
import { fetchPeople } from '../../shared/api/backend/adminApi'
import { ModerationNav } from './components/ModerationNav'
import { pageCount, toPersonRow } from './logic/peopleView'
import styles from './people.module.css'

const PAGE_SIZE = 20

export function PeoplePage() {
  // Введённое и поданное разделены: запрос на каждой букве — это запрос на каждую букву,
  // а список людей читает всю таблицу по тексту профиля.
  const [typed, setTyped] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const people = useQuery({
    queryKey: ['people', search, page],
    queryFn: ({ signal }) =>
      fetchPeople({ query: search || undefined, page, page_size: PAGE_SIZE }, signal),
  })

  const rows = (people.data?.items ?? []).map(toPersonRow)
  const pages = pageCount(people.data?.total ?? 0, PAGE_SIZE)

  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="admin-people">
        <Container>
          <ModerationNav />
          <PageSection>
            <PageHeading title="Люди" sub="Учётные записи площадки" />

            <form
              className={styles.search}
              onSubmit={(event) => {
                event.preventDefault()
                setPage(1)
                setSearch(typed.trim())
              }}
            >
              <input
                type="search"
                value={typed}
                onChange={(event) => setTyped(event.target.value)}
                placeholder="Имя или его часть"
                aria-label="Поиск по имени"
                data-testid="people-search"
              />
              <Button type="submit">Найти</Button>
            </form>

            {people.isPending ? <ListSkeleton rows={5} /> : null}
            {people.isError ? (
              <FailureNotice
                message="Не удалось получить список"
                onRetry={() => void people.refetch()}
              />
            ) : null}
            {people.isSuccess && rows.length === 0 ? (
              <EmptyNotice title="Никого не нашлось" />
            ) : null}

            {rows.length > 0 ? (
              <ul className={styles.list} data-testid="people-list">
                {rows.map((row) => (
                  <li key={row.id} className={styles.row}>
                    <Link to={ROUTES.adminPerson(row.id)} className={styles.name}>
                      {row.name}
                    </Link>
                    <span className={styles.role}>{row.role}</span>
                    {row.platform ? <span className={styles.meta}>{row.platform}</span> : null}
                    <span className={styles.meta}>с {row.since}</span>
                    {row.blocked ? (
                      <span className={styles.blocked} data-testid="people-blocked">
                        доступ закрыт
                      </span>
                    ) : null}
                    {row.departed ? (
                      <span className={styles.departed} data-testid="people-departed">
                        удалил запись
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}

            {pages > 1 ? (
              <div className={styles.pager} data-testid="people-pager">
                <Button
                  tone="ghost"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Назад
                </Button>
                <span>
                  {page} из {pages}
                </span>
                <Button
                  tone="ghost"
                  disabled={page >= pages}
                  onClick={() => setPage((current) => current + 1)}
                  data-testid="people-next"
                >
                  Дальше
                </Button>
              </div>
            ) : null}
          </PageSection>
        </Container>
      </main>
    </>
  )
}
