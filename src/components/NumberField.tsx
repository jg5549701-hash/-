import { useState } from 'react'
import { MAX_EPISODES, toEpisodeCount } from '../lib/episodes'

/**
 * 화수 입력칸. 0 이상의 정수만 받는다.
 * 입력 도중에는 로컬 텍스트를 쓰고, blur 될 때 정수로 정리한다.
 * (빈 값은 "모름"을 뜻하며, allowEmpty 가 false 면 0 으로 본다)
 */
export function EpisodeInput({
  value,
  onChange,
  label,
  placeholder,
  allowEmpty = true,
}: {
  value: number | undefined
  onChange: (next: number | undefined) => void
  label: string
  placeholder?: string
  allowEmpty?: boolean
}) {
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const text = editing ? draft : value === undefined ? '' : String(value)

  return (
    <input
      type="text"
      inputMode="numeric"
      enterKeyHint="done"
      aria-label={label}
      value={text}
      placeholder={placeholder}
      className="ink-border w-full bg-paper px-3 py-2 text-center text-base font-bold tabular-nums outline-none focus:bg-accent-soft"
      onFocus={() => {
        setDraft(value === undefined ? '' : String(value))
        setEditing(true)
      }}
      onChange={(event) => {
        const raw = event.target.value
        setDraft(raw)
        setEditing(true)
        if (raw.trim() === '') {
          onChange(allowEmpty ? undefined : 0)
          return
        }
        const parsed = toEpisodeCount(raw)
        if (parsed !== undefined) onChange(parsed)
      }}
      onBlur={() => {
        setEditing(false)
        const raw = draft.trim()
        if (raw === '') {
          onChange(allowEmpty ? undefined : 0)
          return
        }
        const parsed = toEpisodeCount(raw)
        onChange(parsed === undefined ? (allowEmpty ? undefined : 0) : Math.min(MAX_EPISODES, parsed))
      }}
    />
  )
}
