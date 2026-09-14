// Люди: кто есть на площадке. Страницей, а не списком целиком — сервер отдаёт страницу
// намеренно, и «показать всех» здесь означало бы прочитать всю базу ради одного экрана.
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { EmptyNotice } from '../../shared/ui/ListStates'
import { QueryStates } from '../../shared/ui/QueryStates'
import { fetchPeople } from '../../shared/api/backend/adminApi'
import { ModerationPage } from './components/ModerationPage'
import { PeopleList } from './components/PeopleList'
import { PeoplePager } from './components/PeoplePager'
import { SearchBox } from './components/SearchBox'
import { pageCount, toPersonRow } from './logic/peopleView'

const PAGE_SIZE = 20

export function PeoplePage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const people = useQuery({
    queryKey: ['people', search, page],
    queryFn: ({ signal }) =>
      fetchPeople({ query: search || undefined, page, page_size: PAGE_SIZE }, signal),
  })
  const rows = (people.data?.items ?? []).map(toPersonRow)
  const pages = pageCount(people.data?.total ?? 0, PAGE_SIZE)
  const submit = (query: string) => {
    setPage(1)
    setSearch(query)
  }

  return (
    <ModerationPage testId="admin-people" title="Люди" sub="Учётные записи площадки">
      <SearchBox onSearch={submit} />
      <QueryStates
        query={people}
        isEmpty={rows.length === 0}
        empty={<EmptyNotice title="Никого не нашлось" />}
        skeletonRows={5}
        failureMessage="Не удалось получить список"
      />
      {rows.length > 0 ? <PeopleList rows={rows} /> : null}
      {pages > 1 ? <PeoplePager page={page} pages={pages} onPage={setPage} /> : null}
    </ModerationPage>
  )
}
