// Заявка на роль поставщика. Одобряет человек, а не проверка документов, — и текст об этом
// говорит прямо: обещание проверки, которой нет, стоит дороже, чем её отсутствие.
//
// В заявке два поля, а не анкета: сервер принимает «зачем» и свободный текст. Условия
// поставки — страны, марки, сроки, предоплата — принадлежат профилю поставщика, который
// заполняют после одобрения (история 16). Спрашивать их здесь значило бы собирать то,
// чего никто не сохранит.
import { Link } from 'react-router-dom'
import { Container } from '../../shared/ui/Container'
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { PageSection } from '../../shared/ui/PageHeading'
import { NarrowPage } from '../../shared/ui/FormCard'
import { ROUTES } from '../../shared/navigation/routes'
import { ApplicationCard } from './components/ApplicationCard'
import styles from './profile.module.css'

export function SupplierApplicationPage() {
  return (
    <>
      <SiteHeader signedIn />
      <main data-testid="supplier-application-form">
        <Container>
          <NarrowPage>
            <div className={styles.crumbs}>
              <Link to={ROUTES.profile}>Профиль</Link> › Стать поставщиком
            </div>
            <PageSection>
              <ApplicationCard />
            </PageSection>
          </NarrowPage>
        </Container>
      </main>
    </>
  )
}
