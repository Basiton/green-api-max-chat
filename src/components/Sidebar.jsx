import { useState } from 'react'
import { normalizePhone, isValidPhone } from '../api/greenApi'
import { formatTime, initials } from '../format'

export default function Sidebar({ chats, activeId, onSelect, onCreate, onLogout, status }) {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    const digits = normalizePhone(phone)
    if (!isValidPhone(digits)) {
      setError('Номер в формате 79991234567 (11–12 цифр)')
      return
    }
    setBusy(true)
    try {
      await onCreate(digits)
      setPhone('')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <span className="sidebar__title">Чаты</span>
        <span className={`status status--${status}`} title={status === 'online' ? 'Получение сообщений работает' : 'Нет связи с GREEN-API'} />
        <button className="link-btn" onClick={onLogout} type="button">Выйти</button>
      </header>

      <form className="new-chat" onSubmit={handleCreate}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Номер, напр. 79991234567"
          inputMode="tel"
        />
        <button className="btn btn--small" type="submit" disabled={busy}>{busy ? '…' : 'Создать'}</button>
      </form>
      {error && <div className="new-chat__error">{error}</div>}

      <ul className="chat-list">
        {chats.length === 0 && <li className="chat-list__empty">Введите номер, чтобы начать чат</li>}
        {chats.map((chat) => {
          const last = chat.messages[chat.messages.length - 1]
          return (
            <li key={chat.chatId}>
              <button
                type="button"
                className={`chat-item${chat.chatId === activeId ? ' chat-item--active' : ''}`}
                onClick={() => onSelect(chat.chatId)}
              >
                <span className="avatar">{initials(chat.name || chat.phone)}</span>
                <span className="chat-item__body">
                  <span className="chat-item__top">
                    <span className="chat-item__name">{chat.name || `+${chat.phone}`}</span>
                    {last && <span className="chat-item__time">{formatTime(last.time)}</span>}
                  </span>
                  <span className="chat-item__last">
                    {last ? `${last.out ? 'Вы: ' : ''}${last.text}` : 'Нет сообщений'}
                  </span>
                </span>
                {chat.unread > 0 && <span className="badge">{chat.unread}</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </aside>
  )
}
