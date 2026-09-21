import { useId, type CSSProperties } from 'react'
import { MAX_SCORE, SCORE_STEP, clampScore } from '../lib/rating'

const STAR_PATH =
  'M12 2.4l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.36 6.12 20.51l1.12-6.55L2.48 9.32l6.58-.96z'

function StarSvg({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d={STAR_PATH}
        fill={filled ? 'var(--color-accent)' : 'var(--color-paper)'}
        stroke="var(--color-ink)"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 0~5 사이 임의의 소수도 정확히 그 비율만큼 채워서 보여준다. */
function Star({ fill, sizeClass }: { fill: number; sizeClass: string }) {
  const ratio = Math.min(1, Math.max(0, fill))
  const clipStyle: CSSProperties = { clipPath: `inset(0 ${(1 - ratio) * 100}% 0 0)` }
  return (
    <span className={`relative block ${sizeClass}`}>
      <StarSvg filled={false} className="absolute inset-0 h-full w-full" />
      {ratio > 0 && (
        <span className="absolute inset-0 block" style={clipStyle}>
          <StarSvg filled className="h-full w-full" />
        </span>
      )}
    </span>
  )
}

export function StarDisplay({
  value,
  sizeClass = 'h-4 w-4',
  gapClass = 'gap-0.5',
}: {
  value: number
  sizeClass?: string
  gapClass?: string
}) {
  const score = clampScore(value)
  return (
    <span className={`inline-flex items-center ${gapClass}`} role="img" aria-label={`5점 만점에 ${score.toFixed(1)}점`}>
      {Array.from({ length: MAX_SCORE }, (_, index) => (
        <Star key={index} fill={score - index} sizeClass={sizeClass} />
      ))}
    </span>
  )
}

/**
 * 별 5개 / 0.5 단위 10단계 입력.
 * 별마다 왼쪽 절반·오른쪽 절반이 각각 버튼이라 터치에서도 똑같이 동작한다.
 */
export function StarPicker({
  value,
  onChange,
  disabled = false,
  sizeClass = 'h-9 w-9',
}: {
  value: number
  onChange: (next: number) => void
  disabled?: boolean
  sizeClass?: string
}) {
  const groupId = useId()
  const score = clampScore(value)

  return (
    <div
      className={`inline-flex items-center gap-1 ${disabled ? 'opacity-40' : ''}`}
      role="group"
      aria-label="별점"
    >
      {Array.from({ length: MAX_SCORE }, (_, index) => {
        const half = index + SCORE_STEP
        const full = index + 1
        return (
          <span key={`${groupId}-${index}`} className={`relative block ${sizeClass}`}>
            <Star fill={score - index} sizeClass="h-full w-full" />
            <button
              type="button"
              disabled={disabled}
              aria-label={`${half}점`}
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer disabled:cursor-default"
              onClick={() => onChange(half)}
            />
            <button
              type="button"
              disabled={disabled}
              aria-label={`${full}점`}
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer disabled:cursor-default"
              onClick={() => onChange(full)}
            />
          </span>
        )
      })}
    </div>
  )
}
