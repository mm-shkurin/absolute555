import { Button, ButtonLink } from '../../../shared/ui/Button'
import { IconTile } from '../../../shared/ui/Icon'
import { ROUTES } from '../../../shared/navigation/routes'
import styles from './FeedStates.module.css'

interface FilteredEmptyProps {
  onReset: () => void
}

export function FilteredEmpty({ onReset }: FilteredEmptyProps) {
  return (
    <div className={styles.empty} data-testid="feed-empty" data-kind="filtered">
      <IconTile name="search" className={styles.emptyMark} />
      <h3>Под эти условия машин нет</h3>
      <p>
        Несколько фильтров сразу отсекают почти всё. Уберите цену или карту замеров — подходящих
        станет заметно больше.
      </p>
      <Button onClick={onReset}>Сбросить фильтры</Button>
    </div>
  )
}

export function ColdEmpty() {
  return (
    <div className={styles.empty} data-testid="feed-empty" data-kind="cold">
      <IconTile name="car" className={styles.emptyMark} />
      <h3>Объявлений ещё нет</h3>
      <p>
        Площадка только открылась. Первое объявление увидят все, кто зайдёт следом — и оно провисит
        наверху дольше любого другого.
      </p>
      <div className={styles.coldActions}>
        <ButtonLink to={ROUTES.selling}>Разместить первым</ButtonLink>
        <ButtonLink to={ROUTES.landing} tone="ghost">
          Как это работает
        </ButtonLink>
      </div>
    </div>
  )
}
