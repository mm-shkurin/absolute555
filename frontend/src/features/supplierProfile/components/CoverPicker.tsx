// Фото витрины: поставить, заменить, убрать. У опубликованной витрины новое фото — такая же
// правка, как текст: покупатели увидят его после одобрения модератора.
import { useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../shared/ui/Button'
import { dropMyCover, uploadMyCover } from '../../../shared/api/backend/supplierApi'
import type { SupplierProfileWire } from '../../../shared/api/backend/supplierContract'
import styles from '../supplierProfile.module.css'

export function CoverPicker({
  coverUrl,
  pending = false,
}: {
  coverUrl: string | null
  pending?: boolean
}) {
  const client = useQueryClient()
  const input = useRef<HTMLInputElement>(null)
  const saved = (profile: SupplierProfileWire) => {
    client.setQueryData(['supplier-profile'], profile)
    void client.invalidateQueries({ queryKey: ['supplier'] })
  }
  const upload = useMutation({ mutationFn: uploadMyCover, onSuccess: saved })
  const drop = useMutation({ mutationFn: dropMyCover, onSuccess: saved })
  const busy = upload.isPending || drop.isPending
  const failure = upload.error ?? drop.error

  return (
    <div className={styles.cover} data-testid="supplier-cover">
      {coverUrl ? (
        <img className={styles.coverImage} src={coverUrl} alt="Фото витрины" />
      ) : (
        <div className={styles.coverEmpty}>Нет фото</div>
      )}
      <div className={styles.coverActions}>
        <input
          ref={input}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload.mutate(file)
            event.target.value = ''
          }}
          data-testid="cover-input"
        />
        <Button tone="ghost" size="small" disabled={busy} onClick={() => input.current?.click()}>
          {coverUrl ? 'Заменить фото' : 'Загрузить фото'}
        </Button>
        {coverUrl ? (
          <Button tone="ghost" size="small" disabled={busy} onClick={() => drop.mutate()}>
            Убрать
          </Button>
        ) : null}
      </div>
      {pending ? (
        <p className={styles.coverNote}>Новое фото увидят покупатели после одобрения модератора.</p>
      ) : null}
      {failure ? <p className={styles.gaps}>{failure.message}</p> : null}
    </div>
  )
}
