// Вопросы на нативных <details>: раскрытие работает без JavaScript и читается скринридером
// как раскрывающийся блок — своя реализация на состоянии обе эти вещи теряет.
import { Container } from '../../../shared/ui/Container'
import { FAQ } from '../content/faq'
import { SectionHead } from './SectionParts'
import styles from '../landing.module.css'
import own from './FaqSection.module.css'

export function FaqSection() {
  return (
    <section className={`${styles.section} ${styles.tight}`} data-testid="landing-faq">
      <Container narrow>
        <SectionHead eyebrow="Вопросы" title="Коротко о непонятном" />
        <div className={own.faq}>
          {FAQ.map((item, index) => (
            <details key={item.question} open={index === 0}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
