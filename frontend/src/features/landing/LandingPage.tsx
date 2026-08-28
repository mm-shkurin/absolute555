// Лендинг: обещание гостю, семь секций сверху вниз. Данных не запрашивает — всё, что здесь
// есть, это текст продукта; первый запрос человек делает уже в ленте.
import { SiteHeader } from '../../shared/ui/SiteHeader'
import { Hero } from './components/Hero'
import { HowItWorks, ThicknessPitch } from './components/HowItWorks'
import { ListingContents } from './components/ListingContents'
import { ImportChannel, SafetyBand } from './components/ImportChannel'
import { MobileApp } from './components/MobileApp'
import { FaqSection } from './components/FaqSection'
import { FinalCta } from './components/FinalCta'

export function LandingPage({ onSignIn }: { onSignIn?: () => void }) {
  return (
    <>
      <SiteHeader signedIn={false} onSignIn={onSignIn} />
      <main data-testid="landing">
        <Hero />
        <HowItWorks />
        <ThicknessPitch />
        <ListingContents />
        <ImportChannel />
        <SafetyBand />
        <MobileApp />
        <FaqSection />
        <FinalCta />
      </main>
    </>
  )
}
