// Тонкая обёртка над HTTP API GREEN-API для MAX (v3).
// Документация: https://green-api.com/v3/docs/

export function defaultApiUrl(idInstance) {
  // apiUrl инстанса указан в личном кабинете. Обычно это https://{первые 4 цифры idInstance}.api.green-api.com
  const id = String(idInstance || '').trim()
  return id.length >= 4 ? `https://${id.slice(0, 4)}.api.green-api.com` : 'https://api.green-api.com'
}

function buildUrl({ apiUrl, idInstance, apiTokenInstance }, method, suffix = '') {
  const base = apiUrl.replace(/\/+$/, '')
  return `${base}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`
}

async function request(creds, method, { httpMethod = 'GET', body, suffix, signal } = {}) {
  const res = await fetch(buildUrl(creds, method, suffix), {
    method: httpMethod,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${method}: HTTP ${res.status}${text ? ` — ${text.slice(0, 200)}` : ''}`)
  }
  // ReceiveNotification при пустой очереди возвращает пустое тело или null
  return text ? JSON.parse(text) : null
}

export const getStateInstance = (creds, signal) =>
  request(creds, 'getStateInstance', { signal })

export const checkAccount = (creds, phoneNumber) =>
  request(creds, 'checkAccount', { httpMethod: 'POST', body: { phoneNumber: Number(phoneNumber) } })

export const sendMessage = (creds, chatId, message) =>
  request(creds, 'sendMessage', { httpMethod: 'POST', body: { chatId, message } })

export const receiveNotification = (creds, signal, receiveTimeout = 5) =>
  request(creds, 'receiveNotification', { suffix: `?receiveTimeout=${receiveTimeout}`, signal })

export const deleteNotification = (creds, receiptId) =>
  request(creds, 'deleteNotification', { httpMethod: 'DELETE', suffix: `/${receiptId}` })

// Нормализация номера: оставляем только цифры, 8XXXXXXXXXX -> 7XXXXXXXXXX
export function normalizePhone(input) {
  let digits = String(input || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) digits = '7' + digits.slice(1)
  return digits
}

export function isValidPhone(digits) {
  return /^\d{11,12}$/.test(digits)
}

// Достаёт текстовое сообщение из уведомления. Возвращает null для всего остального.
export function parseTextNotification(body) {
  if (!body || !body.messageData) return null
  const { typeWebhook, senderData = {}, messageData, idMessage, timestamp } = body
  const incoming = typeWebhook === 'incomingMessageReceived'
  // outgoingMessageReceived — сообщение, отправленное с телефона владельца инстанса
  const outgoingFromPhone = typeWebhook === 'outgoingMessageReceived'
  if (!incoming && !outgoingFromPhone) return null

  const { typeMessage } = messageData
  let text = null
  if (typeMessage === 'textMessage') text = messageData.textMessageData?.textMessage
  else if (typeMessage === 'extendedTextMessage') text = messageData.extendedTextMessageData?.text
  else if (typeMessage === 'quotedMessage') text = messageData.extendedTextMessageData?.text
  if (typeof text !== 'string') return null

  return {
    id: String(idMessage || `${timestamp}-${Math.random()}`),
    chatId: String(senderData.chatId || ''),
    chatName: senderData.chatName || senderData.senderName || '',
    phone: senderData.senderPhoneNumber ? String(senderData.senderPhoneNumber) : '',
    text,
    time: (timestamp || Math.floor(Date.now() / 1000)) * 1000,
    out: outgoingFromPhone,
  }
}
