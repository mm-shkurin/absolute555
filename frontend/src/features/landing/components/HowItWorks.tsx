import { SELLING_STEPS, THICKNESS_STEPS } from '../content/steps'
import { LandingSection } from './LandingSection'
import { StepList } from './SectionParts'

export function HowItWorks() {
  return (
    <LandingSection
      testId="landing-how"
      eyebrow="Как это работает"
      title="Три шага от фото до объявления"
      sub="Продавец не заполняет двадцать полей. Он фотографирует документ."
    >
      <StepList steps={SELLING_STEPS} numbered />
    </LandingSection>
  )
}

export function ThicknessPitch() {
  return (
    <LandingSection
      testId="landing-thickness"
      tight
      eyebrow="Чего нет у других"
      title="Карта замеров вместо слов «не бит не крашен»"
      sub={
        'Продавец прикладывает толщиномер к панели и фотографирует экран прибора. Число ' +
        'считывается с фотографии — вписать своё нельзя. Панель окрашивается по замеру, ' +
        'покупатель читает кузов за секунду.'
      }
    >
      <StepList steps={THICKNESS_STEPS} />
    </LandingSection>
  )
}
