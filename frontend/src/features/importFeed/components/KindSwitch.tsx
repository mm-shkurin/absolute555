import type { ImportKind } from '../api/importApi'
import styles from '../importFeed.module.css'

const KINDS: { id: ImportKind; title: string; hint: string }[] = [
  { id: 'cars', title: 'Машины под привоз', hint: 'конкретные позиции с ценой под ключ' },
  { id: 'suppliers', title: 'Поставщики', hint: 'кто что возит и на каких условиях' },
  { id: 'requests', title: 'Заявки покупателей', hint: 'обратный аукцион: отклик вместо оффера' },
]

export function KindSwitch({
  current,
  onSelect,
}: {
  current: ImportKind
  onSelect: (kind: ImportKind) => void
}) {
  return (
    <div className={styles.kinds} data-testid="import-kinds">
      {KINDS.map((kind) => (
        <button
          key={kind.id}
          type="button"
          className={styles.kind}
          aria-pressed={kind.id === current}
          onClick={() => onSelect(kind.id)}
        >
          <b>{kind.title}</b>
          <span>{kind.hint}</span>
        </button>
      ))}
    </div>
  )
}
