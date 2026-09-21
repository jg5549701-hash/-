/**
 * 서비스 워커 등록. 설치된 앱이 오프라인에서도 열리게 한다.
 * 등록이 막힌 환경(파일 프로토콜, 샌드박스 iframe 등)에서는 조용히 넘어가고,
 * 앱은 평소대로 동작한다.
 */
export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // 등록 실패는 앱 동작에 영향이 없다.
    })
  })
}
