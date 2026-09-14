// Форма заявки «хочу такую». Обратный аукцион начинается здесь: покупатель описывает
// машину, которой в ленте нет, и поставщики отвечают ценой под ключ.
import { Link } from 'react-router-dom'
import { NarrowFormPage } from '../../shared/ui/NarrowFormPage'
import { ROUTES } from '../../shared/navigation/routes'
import { NewRequestCard } from './components/NewRequestCard'
import styles from './request.module.css'

export function NewRequestPage({ signedIn = true }: { signedIn?: boolean }) {
  const crumbs = (
    <>
      <Link to={ROUTES.importFeed}>Под заказ</Link> › Новая заявка
    </>
  )
  return (
    <NarrowFormPage
      signedIn={signedIn}
      testId="new-import-request"
      crumbs={crumbs}
      crumbsClassName={styles.crumbs}
    >
      <NewRequestCard />
    </NarrowFormPage>
  )
}
