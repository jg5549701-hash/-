import { useEffect, type ReactNode } from 'react'

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  // 다이얼로그가 열려 있는 동안 뒤 배경이 스크롤되지 않게 한다.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="닫기"
        className="anim-fade absolute inset-0 bg-ink/60"
        onClick={onClose}
      />
      <div className="anim-pop relative flex max-h-[92vh] flex-col border-t-4 border-ink bg-paper">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b-2 border-ink bg-ink px-4 py-3">
          <h2 className="font-display truncate text-lg text-paper">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 border-2 border-paper px-2.5 py-1 text-sm font-bold text-paper"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer && (
          <div className="shrink-0 border-t-2 border-ink bg-paper-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
