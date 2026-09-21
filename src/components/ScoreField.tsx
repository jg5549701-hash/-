import { useState } from 'react'
import { MAX_SCORE, MIN_SCORE, SCORE_STEP, clampScore, formatScore, snapScore } from '../lib/rating'
import { StarPicker } from './Stars'

function toText(value: number | null): string {
  // 앱의 다른 곳과 똑같이 소수 한 자리로 보여준다.
  // (자동 평균 4.666… 같은 값이 입력칸에 길게 찍히는 것도 함께 막아준다)
  return value === null ? '' : formatScore(value)
}

/**
 * 숫자 직접 입력칸.
 * "4." 처럼 입력 도중인 상태에서 값이 튀지 않도록 로컬 텍스트 상태를 두고,
 * blur 될 때 0~5 / 0.5 단위로 정리한다.
 */
function ScoreNumberInput({
  value,
  onChange,
  disabled,
  label,
}: {
  value: number | null
  onChange: (next: number | null) => void
  disabled?: boolean
  label: string
}) {
  // 입력 중("4." 같은 상태)에만 로컬 텍스트를 보여주고,
  // 그 밖에는 항상 실제 값에서 바로 그린다 — 별을 눌러 바뀐 값이 즉시 반영된다.
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const text = editing ? draft : toText(value)

  return (
    <input
      type="text"
      inputMode="decimal"
      enterKeyHint="done"
      aria-label={`${label} 점수 직접 입력`}
      disabled={disabled}
      value={text}
      placeholder="-"
      className="w-16 shrink-0 border-2 border-ink bg-paper px-2 py-1 text-center text-base font-bold tabular-nums outline-none focus:bg-accent-soft disabled:opacity-40"
      onFocus={() => {
        setDraft(toText(value))
        setEditing(true)
      }}
      onChange={(event) => {
        const raw = event.target.value
        setDraft(raw)
        setEditing(true)
        if (raw.trim() === '') {
          onChange(null)
          return
        }
        const parsed = Number(raw)
        if (!Number.isFinite(parsed)) return
        // 입력 중에는 범위만 자르고, 0.5 단위 정리는 blur 에서 한다.
        onChange(clampScore(parsed))
      }}
      onBlur={() => {
        setEditing(false)
        const raw = draft.trim()
        if (raw === '') {
          onChange(null)
          return
        }
        const parsed = Number(raw)
        if (!Number.isFinite(parsed)) return
        onChange(snapScore(parsed))
      }}
    />
  )
}

/** 별 + 숫자 입력칸을 묶은 점수 입력 한 줄. */
export function ScoreField({
  label,
  value,
  onChange,
  disabled = false,
  hint,
}: {
  label: string
  value: number | null
  onChange: (next: number | null) => void
  disabled?: boolean
  hint?: string
}) {
  return (
    <div data-score-field={label} className={disabled ? 'opacity-70' : ''}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold">{label}</span>
        <span className="text-[11px] text-ink-soft">
          {hint ?? `${MIN_SCORE}~${MAX_SCORE} · ${SCORE_STEP}점 단위`}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <StarPicker
          value={value ?? 0}
          disabled={disabled}
          onChange={(next) => onChange(next)}
          sizeClass="h-8 w-8"
        />
        <ScoreNumberInput label={label} value={value} onChange={onChange} disabled={disabled} />
        <button
          type="button"
          disabled={disabled || value === null}
          onClick={() => onChange(null)}
          className="shrink-0 border-2 border-ink px-2 py-1 text-[11px] font-bold disabled:opacity-30"
        >
          지움
        </button>
      </div>
    </div>
  )
}
