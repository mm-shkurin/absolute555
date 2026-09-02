// Лендинг: обещание гостю, семь секций сверху вниз. Данных не запрашивает — всё, что здесь
// есть, это текст продукта; первый запрос человек делает уже в ленте.
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { Hero } from './components/Hero'
import { PageGlow } from './components/PageGlow'
import { FeedShowcase } from './components/FeedShowcase'
import { HowItWorks, ThicknessPitch } from './components/HowItWorks'
import { ListingContents } from './components/ListingContents'
import { ImportChannel, SafetyBand } from './components/ImportChannel'
import { MobileApp } from './components/MobileApp'
import { FaqSection } from './components/FaqSection'
import { FinalCta } from './components/FinalCta'
import styles from './landing.module.css'

// Вошедший тоже читает эту страницу — по ссылке «как это работает» из пустой ленты и из
// справки, — и шапка у него должна остаться его: с аватаром, а не с кнопкой «Войти».
export function LandingPage({
  signedIn = false,
  onSignIn,
}: {
  signedIn?: boolean
  onSignIn?: () => void
}) {
  return (
    <div className={styles.page}>
      <PageGlow />
      <SiteHeader signedIn={signedIn} onSignIn={onSignIn} floating />
      <main data-testid="landing">
        <Hero />
        <FeedShowcase />
        <HowItWorks />
        <ThicknessPitch />
        <ListingContents />
        <ImportChannel />
        <SafetyBand />
        <MobileApp />
        <FaqSection />
        <FinalCta />
      </main>
    </div>
  )
}
