import { useEffect, useRef } from 'react'
import { receiveNotification, deleteNotification, parseTextNotification } from '../api/greenApi'

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => { clearTimeout(t); resolve() }, { once: true })
  })

// Цикл получения входящих уведомлений по технологии HTTP API:
// ReceiveNotification -> обработка -> DeleteNotification -> следующий запрос.
export function useNotifications(creds, onMessage, onStatus) {
  const onMessageRef = useRef(onMessage)
  const onStatusRef = useRef(onStatus)
  onMessageRef.current = onMessage
  onStatusRef.current = onStatus

  useEffect(() => {
    if (!creds) return undefined
    const controller = new AbortController()
    const { signal } = controller

    ;(async () => {
      let errorDelay = 2000
      while (!signal.aborted) {
        try {
          const data = await receiveNotification(creds, signal, 5)
          onStatusRef.current?.('online')
          errorDelay = 2000
          if (!data || !data.receiptId) continue

          const msg = parseTextNotification(data.body)
          if (msg) onMessageRef.current?.(msg)
          // Удаляем любое уведомление, иначе очередь встанет на нём
          await deleteNotification(creds, data.receiptId)
        } catch (err) {
          if (signal.aborted) break
          onStatusRef.current?.('error', err.message)
          await sleep(errorDelay, signal)
          errorDelay = Math.min(errorDelay * 2, 30000)
        }
      }
    })()

    return () => controller.abort()
  }, [creds])
}
