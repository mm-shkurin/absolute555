import { Container } from '../../../shared/ui/Container'
import { SELLING_STEPS, THICKNESS_STEPS } from '../content/steps'
import { SectionHead, StepList } from './SectionParts'
import styles from '../landing.module.css'

export function HowItWorks() {
  return (
    <section className={styles.section} data-testid="landing-how">
      <Container>
        <SectionHead
          eyebrow="Как это работает"
          title="Три шага от фото до объявления"
          sub="Продавец не заполняет двадцать полей. Он фотографирует документ."
        />
        <StepList steps={SELLING_STEPS} numbered />
      </Container>
    </section>
  )
}

export function ThicknessPitch() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-thickness">
      <Container>
        <SectionHead
          eyebrow="Чего нет у других"
          title="Карта замеров вместо слов «не бит не крашен»"
          sub={
            'Продавец прикладывает толщиномер к панели и фотографирует экран прибора. Число ' +
            'считывается с фотографии — вписать своё нельзя. Панель окрашивается по замеру, ' +
            'покупатель читает кузов за секунду.'
          }
        />
        <StepList steps={THICKNESS_STEPS} />
      </Container>
    </section>
  )
}
