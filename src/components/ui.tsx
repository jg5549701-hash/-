import type { ReactNode, TouchEvent } from 'react'

/** 알약(pill) 모양 칩. 선택되면 포인트 색으로 채워진다. */
export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border-2 border-ink px-3.5 py-1.5 text-sm leading-none font-bold whitespace-nowrap transition-colors ${
        active ? 'bg-accent text-white' : 'bg-paper text-ink'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * 가로 스크롤되는 칩 영역.
 * 여기서 발생한 터치는 탭 스와이프로 절대 올라가면 안 된다:
 *  - CSS: overscroll-behavior-x: contain / touch-action: pan-x  (h-scroll 유틸)
 *  - JS: 터치 이벤트 전파 차단
 *  - 보험: data-no-swipe 로 스와이프 핸들러가 한 번 더 걸러낸다
 */
export function HScroll({
  children,
  className = '',
  ariaLabel,
}: {
  children: ReactNode
  className?: string
  ariaLabel?: string
}) {
  const stop = (event: TouchEvent<HTMLDivElement>) => event.stopPropagation()
  return (
    <div
      data-no-swipe="true"
      aria-label={ariaLabel}
      className={`h-scroll flex items-center gap-2 ${className}`}
      onTouchStart={stop}
      onTouchMove={stop}
      onTouchEnd={stop}
      onTouchCancel={stop}
    >
      {children}
    </div>
  )
}

/** 비교용 가로 막대 하나. */
export function Bar({
  label,
  value,
  max = 5,
  valueText,
  muted = false,
}: {
  label: string
  value: number
  max?: number
  valueText?: string
  muted?: boolean
}) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  return (
    <div className="flex items-center gap-2">
      <span className="w-14 shrink-0 text-xs font-bold">{label}</span>
      <span className="relative h-5 min-w-0 flex-1 border-2 border-ink bg-paper-2">
        <span
          className={`absolute inset-y-0 left-0 ${muted ? 'bg-ink-soft' : 'bg-accent'}`}
          style={{ width: `${ratio * 100}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right text-xs font-bold tabular-nums">
        {valueText ?? (muted ? '-' : value.toFixed(1))}
      </span>
    </div>
  )
}

/** 읽은 화수 진행 막대. */
export function ProgressBar({
  ratio,
  heightClass = 'h-2',
  done = false,
}: {
  ratio: number
  heightClass?: string
  done?: boolean
}) {
  const width = Math.min(1, Math.max(0, ratio)) * 100
  return (
    <span className={`relative block w-full border-2 border-ink bg-paper-2 ${heightClass}`}>
      <span
        className={`absolute inset-y-0 left-0 ${done ? 'bg-ink' : 'bg-accent'}`}
        style={{ width: `${width}%` }}
      />
    </span>
  )
}

/** 상태 배지. 완독은 검정, 완결은 포인트 색. */
export function StatusBadge({ tone, children }: { tone: 'ink' | 'accent'; children: ReactNode }) {
  return (
    <span
      className={`border border-ink px-1.5 py-px text-[10px] leading-tight font-bold whitespace-nowrap text-paper ${
        tone === 'ink' ? 'bg-ink' : 'bg-accent'
      }`}
    >
      {children}
    </span>
  )
}

/** 만화책 톤의 체크박스. 라벨 전체가 터치 영역이다. */
export function Checkbox({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="ink-border press flex w-full items-center gap-2.5 bg-paper px-3 py-2.5 text-left"
    >
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 border-ink text-sm leading-none font-bold ${
          checked ? 'bg-accent text-white' : 'bg-paper text-transparent'
        }`}
      >
        ✓
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-[11px] text-ink-soft">{hint}</span>}
      </span>
    </button>
  )
}

/** 표지. 이미지가 없거나 로딩에 실패하면 자리 표시를 보여준다. */
export function Cover({
  src,
  title,
  className = '',
}: {
  src: string
  title: string
  className?: string
}) {
  return (
    <div className={`relative overflow-hidden border-2 border-ink bg-paper-2 ${className}`}>
      <div className="halftone absolute inset-0" aria-hidden="true" />
      {src ? (
        <img
          src={src}
          alt={`${title} 표지`}
          loading="lazy"
          className="relative h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
      ) : (
        <span className="relative flex h-full w-full items-center justify-center px-1 text-center text-[10px] leading-tight font-bold text-ink-soft">
          NO
          <br />
          COVER
        </span>
      )}
    </div>
  )
}

/** 장르 태그. */
export function GenreTag({ children }: { children: ReactNode }) {
  return (
    <span className="border border-ink bg-paper-2 px-1.5 py-px text-[10px] leading-tight font-bold whitespace-nowrap">
      {children}
    </span>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="ink-border ink-shadow relative mx-auto my-10 max-w-xs bg-paper px-5 py-8 text-center">
      <div className="halftone absolute inset-0" aria-hidden="true" />
      <p className="relative font-display text-lg">{title}</p>
      {description && <p className="relative mt-2 text-sm text-ink-soft">{description}</p>}
    </div>
  )
}
