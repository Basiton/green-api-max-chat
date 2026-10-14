import { useEffect, useRef, useState } from 'react'
import { formatTime, initials } from '../format'

const STATUS_LABEL = { sending: 'отправляется', sent: '✓', error: 'не отправлено' }

export default function ChatView({ chat, onSend, onBack }) {
  const [text, setText] = useState('')
  const listRef = useRef(null)

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat?.messages.length, chat?.chatId])

  if (!chat) {
    return (
      <section className="chat chat--empty">
        <p>Выберите чат или создайте новый по номеру телефона</p>
      </section>
    )
  }

  function submit() {
    const value = text.trim()
    if (!value) return
    onSend(chat.chatId, value)
    setText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <section className="chat">
      <header className="chat__header">
        <button className="link-btn chat__back" type="button" onClick={onBack}>←</button>
        <span className="avatar">{initials(chat.name || chat.phone)}</span>
        <div>
          <div className="chat__name">{chat.name || `+${chat.phone}`}</div>
          {chat.phone && <div className="chat__sub">+{chat.phone}</div>}
        </div>
      </header>

      <div className="chat__messages" ref={listRef}>
        {chat.messages.length === 0 && <div className="chat__placeholder">Напишите первое сообщение</div>}
        {chat.messages.map((m) => (
          <div key={m.id} className={`msg ${m.out ? 'msg--out' : 'msg--in'}`}>
            <div className="msg__text">{m.text}</div>
            <div className="msg__meta">
              {formatTime(m.time)}
              {m.out && m.status && <span className={`msg__status msg__status--${m.status}`}> {STATUS_LABEL[m.status]}</span>}
            </div>
          </div>
        ))}
      </div>

      <footer className="composer">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Сообщение"
          maxLength={4000}
        />
        <button className="composer__send" type="button" onClick={submit} disabled={!text.trim()} aria-label="Отправить">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" /></svg>
        </button>
      </footer>
    </section>
  )
}
