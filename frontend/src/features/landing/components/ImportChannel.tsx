import { Container } from '../../../shared/ui/Container'
import { IMPORT_TILES, SAFETY_TILES } from '../content/tiles'
import { SectionHead, TileList } from './SectionParts'
import styles from '../landing.module.css'

export function ImportChannel() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-import">
      <Container>
        <SectionHead
          eyebrow="Второй канал"
          title="Под заказ из-за рубежа"
          sub={
            'Отдельная вкладка в ленте. Машины ещё нет в стране — значит, нет ни VIN, ни СТС, ' +
            'зато есть срок доставки и цена под ключ с таможней.'
          }
        />
        <TileList tiles={IMPORT_TILES} />
        <div className={styles.note}>
          Поставщиком становятся по заявке: страны, марки, сроки, условия. Заявку рассматривает
          владелец площадки — случайных продавцов под привоз тут нет.
        </div>
      </Container>
    </section>
  )
}

export function SafetyBand() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-safety">
      <Container>
        <div className={styles.band}>
          <SectionHead
            eyebrow="Почему безопаснее"
            title="Ни одного анонимного объявления"
            sub="Четыре вещи, которых нет на бесплатных досках."
          />
          <TileList tiles={SAFETY_TILES} wide />
        </div>
      </Container>
    </section>
  )
}
