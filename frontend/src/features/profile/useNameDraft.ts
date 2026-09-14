import { useState } from 'react'

export interface NameDraft {
  editing: boolean
  draft: string
  setDraft: (value: string) => void
  start: () => void
  save: () => void
  cancel: () => void
}

export function useNameDraft(name: string, onRename: (name: string) => void): NameDraft {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  return {
    editing,
    draft,
    setDraft,
    start: () => {
      setDraft(name)
      setEditing(true)
    },
    save: () => {
      onRename(draft.trim())
      setEditing(false)
    },
    cancel: () => setEditing(false),
  }
}
