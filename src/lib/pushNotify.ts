// Muestra una notificación usando el service worker (obligatorio en Android/
// Chrome móvil, donde `new Notification()` lanza error) con fallback al
// constructor clásico en escritorio.
export async function showAppNotification(
  title: string,
  options: NotificationOptions & { url?: string }
) {
  if (typeof window === 'undefined') return
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  const { url, ...rest } = options
  try {
    if ('serviceWorker' in navigator) {
      // `serviceWorker.ready` nunca resuelve si el registro falló (p.ej. origen
      // no seguro en LAN/móvil) — con timeout cae al fallback en vez de colgarse.
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<null>(resolve => setTimeout(() => resolve(null), 2000)),
      ])
      if (reg) {
        await reg.showNotification(title, { ...rest, data: { url } })
        return
      }
    }
  } catch {
    // cae al fallback
  }

  try {
    const n = new Notification(title, rest)
    n.onclick = () => {
      window.focus()
      if (url) window.location.href = url
      n.close()
    }
    setTimeout(() => n.close(), 9000)
  } catch {}
}
