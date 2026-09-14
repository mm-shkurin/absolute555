import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '../../../shared/ui/Button'
import { blockUser, unblockUser } from '../../../shared/api/backend/adminApi'
import { AccessDialog } from './AccessDialog'
import styles from '../people.module.css'

type AccessMode = 'block' | 'unblock'

interface PersonAccessProps {
  userId: string
  blocked: boolean
}

export function PersonAccess({ userId, blocked }: PersonAccessProps) {
  const [dialog, setDialog] = useState<AccessMode | null>(null)
  const change = useAccessChange(userId, () => setDialog(null))

  return (
    <div className={styles.actions}>
      {dialog === null ? (
        <Button
          tone={blocked ? 'ghost' : undefined}
          onClick={() => setDialog(blocked ? 'unblock' : 'block')}
          data-testid="access-open"
        >
          {blocked ? 'Вернуть доступ' : 'Закрыть доступ'}
        </Button>
      ) : (
        <AccessDialog
          mode={dialog}
          busy={change.isPending}
          onCancel={() => setDialog(null)}
          onConfirm={(reason) => change.mutate({ mode: dialog, reason })}
        />
      )}
      {change.isError ? (
        <p className={styles.reasonError} data-testid="access-failed">
          Сервер отказал. Возможно, эта запись не в вашей власти.
        </p>
      ) : null}
    </div>
  )
}

function useAccessChange(userId: string, onDone: () => void) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ mode, reason }: { mode: AccessMode; reason: string }) =>
      mode === 'block' ? blockUser(userId, reason) : unblockUser(userId, reason),
    onSuccess: () => {
      onDone()
      // Обновляются и карточка, и журнал: действие меняет обе выдачи, и человек,
      // закрывший доступ, ждёт увидеть запись о том, что он только что сделал.
      void client.invalidateQueries({ queryKey: ['person', userId] })
      void client.invalidateQueries({ queryKey: ['person-journal', userId] })
      void client.invalidateQueries({ queryKey: ['people'] })
    },
  })
}
