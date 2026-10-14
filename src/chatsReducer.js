// Состояние: { [chatId]: { chatId, name, phone, unread, messages: [] } }

function upsertChat(state, chatId, patch = {}) {
  const prev = state[chatId] || { chatId, name: '', phone: '', unread: 0, messages: [] }
  return { ...state, [chatId]: { ...prev, ...patch } }
}

// Ищем чат, созданный по номеру телефона, если уведомление пришло с числовым chatId
function resolveChatId(state, msg) {
  if (state[msg.chatId]) return msg.chatId
  if (msg.phone) {
    const byPhone = Object.values(state).find((c) => c.phone === msg.phone)
    if (byPhone) return byPhone.chatId
  }
  return msg.chatId
}

export function chatsReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return action.chats || {}

    case 'create': {
      const { chatId, phone } = action
      return upsertChat(state, chatId, { phone, ...(state[chatId] ? {} : { name: '' }) })
    }

    case 'read':
      return state[action.chatId] ? upsertChat(state, action.chatId, { unread: 0 }) : state

    case 'outgoing': {
      const chat = state[action.chatId]
      if (!chat) return state
      return upsertChat(state, action.chatId, { messages: [...chat.messages, action.message] })
    }

    case 'outgoingStatus': {
      const chat = state[action.chatId]
      if (!chat) return state
      const messages = chat.messages.map((m) =>
        m.id === action.localId ? { ...m, status: action.status, id: action.idMessage || m.id } : m,
      )
      return upsertChat(state, action.chatId, { messages })
    }

    case 'notification': {
      const { msg, activeId } = action
      if (!msg.chatId) return state
      const chatId = resolveChatId(state, msg)
      const chat = state[chatId] || { chatId, name: '', phone: '', unread: 0, messages: [] }
      if (chat.messages.some((m) => m.id === msg.id)) return state // дубликат
      return upsertChat(state, chatId, {
        name: chat.name || msg.chatName,
        phone: chat.phone || msg.phone,
        unread: !msg.out && chatId !== activeId ? chat.unread + 1 : chat.unread,
        messages: [...chat.messages, { id: msg.id, text: msg.text, time: msg.time, out: msg.out }],
      })
    }

    default:
      return state
  }
}

export function sortedChats(state) {
  const lastTime = (c) => c.messages[c.messages.length - 1]?.time || c.createdAt || 0
  return Object.values(state).sort((a, b) => lastTime(b) - lastTime(a))
}
