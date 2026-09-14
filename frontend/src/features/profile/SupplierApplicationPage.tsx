// Заявка на роль поставщика. Одобряет человек, а не проверка документов, — и текст об этом
// говорит прямо: обещание проверки, которой нет, стоит дороже, чем её отсутствие.
//
// В заявке два поля, а не анкета: сервер принимает «зачем» и свободный текст. Условия
// поставки — страны, марки, сроки, предоплата — принадлежат профилю поставщика, который
// заполняют после одобрения (история 16). Спрашивать их здесь значило бы собирать то,
// чего никто не сохранит.
import { Link } from 'react-router-dom'
import { NarrowFormPage } from '../../shared/ui/NarrowFormPage'
import { ROUTES } from '../../shared/navigation/routes'
import { ApplicationCard } from './components/ApplicationCard'
import styles from './profile.module.css'

export function SupplierApplicationPage() {
  const crumbs = (
    <>
      <Link to={ROUTES.profile}>Профиль</Link> › Стать поставщиком
    </>
  )
  return (
    <NarrowFormPage
      signedIn
      testId="supplier-application-form"
      crumbs={crumbs}
      crumbsClassName={styles.crumbs}
    >
      <ApplicationCard />
    </NarrowFormPage>
  )
}
