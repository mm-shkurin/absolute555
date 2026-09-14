import { LISTING_CONTENTS } from '../content/faq'
import { SectionHead } from './SectionParts'
import own from './ListingContents.module.css'

export function ListingContentsText() {
  return (
    <div>
      <SectionHead
        eyebrow="Что внутри объявления"
        title="Всё, что обычно приходится выпытывать в переписке"
        sub={
          'Продавец заполняет один раз, покупатель не задаёт одни и те же пять вопросов ' +
          'каждому.'
        }
      />
      <ul className={own.list}>
        {LISTING_CONTENTS.map((item) => (
          <li key={item.lead}>
            <b>{item.lead}</b> {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
