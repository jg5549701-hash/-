import { useEffect, useState } from 'react'

/**
 * 현재 시각. 랭킹의 "최근 7일" 같은 기준선은 시간이 지나면 움직여야 하므로
 * 렌더 중에 Date.now() 를 부르지 않고 주기적으로 갱신되는 상태로 들고 있는다.
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}
