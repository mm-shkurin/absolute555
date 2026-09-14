import { ButtonLink } from '../../../shared/ui/Button'
import { ROUTES } from '../../../shared/navigation/routes'
import { SectionHead } from './SectionParts'
import styles from './FeedShowcase.module.css'

export function ShowcaseHead() {
  return (
    <div className={styles.head}>
      <div>
        <SectionHead
          eyebrow="Сейчас в продаже"
          title="Кузов видно ещё до звонка"
          sub={
            'Полоска под ценой — карта замеров: сколько панелей кузова уже промерено ' +
            'толщиномером. Серая — замеров нет.'
          }
        />
      </div>
      <ButtonLink to={ROUTES.feed} size="big" data-testid="showcase-feed">
        Перейти к ленте
      </ButtonLink>
    </div>
  )
}
