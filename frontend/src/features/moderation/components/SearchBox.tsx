import { useState, type FormEvent } from 'react'
import { Button } from '../../../shared/ui/Button'
import styles from '../people.module.css'

interface SearchBoxProps {
  onSearch: (query: string) => void
}

export function SearchBox({ onSearch }: SearchBoxProps) {
  // Введённое и поданное разделены: запрос на каждой букве — это запрос на каждую букву,
  // а список людей читает всю таблицу по тексту профиля.
  const [typed, setTyped] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    onSearch(typed.trim())
  }

  return (
    <form className={styles.search} onSubmit={submit}>
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
  )
}
