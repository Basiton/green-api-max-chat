import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import LoginScreen from './components/LoginScreen'
import Sidebar from './components/Sidebar'
import ChatView from './components/ChatView'
import { checkAccount, sendMessage } from './api/greenApi'
import { useNotifications } from './hooks/useNotifications'
import { chatsReducer, sortedChats } from './chatsReducer'
import { load, save } from './storage'
import './App.css'

const CREDS_KEY = 'maxchat:creds'
const chatsKey = (creds) => `maxchat:chats:${creds.idInstance}`

export default function App() {
  const [creds, setCreds] = useState(() => load(CREDS_KEY, null))
  const [chats, dispatch] = useReducer(chatsReducer, {}, () => (creds ? load(chatsKey(creds), {}) : {}))
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('connecting')
  const activeRef = useRef(activeId)
  activeRef.current = activeId

  useEffect(() => {
    if (creds) save(chatsKey(creds), chats)
  }, [chats, creds])

  const handleNotification = useCallback((msg) => {
    dispatch({ type: 'notification', msg, activeId: activeRef.current })
  }, [])
  const handleStatus = useCallback((s) => setStatus(s), [])
  useNotifications(creds, handleNotification, handleStatus)

  function handleLogin(newCreds) {
    save(CREDS_KEY, newCreds)
    dispatch({ type: 'reset', chats: load(chatsKey(newCreds), {}) })
    setActiveId(null)
    setStatus('connecting')
    setCreds(newCreds)
  }

  function handleLogout() {
    save(CREDS_KEY, null)
    setCreds(null)
    setActiveId(null)
  }

  async function handleCreate(phone) {
    // Если чат с этим номером уже есть — просто открываем его
    const existing = Object.values(chats).find((c) => c.phone === phone)
    if (existing) {
      selectChat(existing.chatId)
      return
    }
    const res = await checkAccount(creds, phone)
    if (!res?.exist || !res.chatId) {
      throw new Error(res?.reason || 'На этом номере нет аккаунта MAX')
    }
    dispatch({ type: 'create', chatId: String(res.chatId), phone })
    selectChat(String(res.chatId))
  }

  function selectChat(chatId) {
    setActiveId(chatId)
    dispatch({ type: 'read', chatId })
  }

  async function handleSend(chatId, text) {
    const localId = `local-${Date.now()}`
    dispatch({ type: 'outgoing', chatId, message: { id: localId, text, time: Date.now(), out: true, status: 'sending' } })
    try {
      const res = await sendMessage(creds, chatId, text)
      dispatch({ type: 'outgoingStatus', chatId, localId, status: 'sent', idMessage: res?.idMessage })
    } catch {
      dispatch({ type: 'outgoingStatus', chatId, localId, status: 'error' })
    }
  }

  const list = useMemo(() => sortedChats(chats), [chats])

  if (!creds) return <LoginScreen onLogin={handleLogin} />

  return (
    <div className={`app${activeId ? ' app--chat-open' : ''}`}>
      <Sidebar
        chats={list}
        activeId={activeId}
        onSelect={selectChat}
        onCreate={handleCreate}
        onLogout={handleLogout}
        status={status}
      />
      <ChatView chat={activeId ? chats[activeId] : null} onSend={handleSend} onBack={() => setActiveId(null)} />
    </div>
  )
}
