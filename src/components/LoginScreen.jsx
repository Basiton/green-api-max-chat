import { useState } from 'react'
import { defaultApiUrl, getStateInstance } from '../api/greenApi'

export default function LoginScreen({ onLogin }) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const effectiveApiUrl = apiUrl.trim() || defaultApiUrl(idInstance)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const creds = {
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: effectiveApiUrl,
    }
    if (!/^\d+$/.test(creds.idInstance) || !creds.apiTokenInstance) {
      setError('Укажите idInstance (только цифры) и apiTokenInstance')
      return
    }
    setLoading(true)
    try {
      const state = await getStateInstance(creds)
      if (state?.stateInstance !== 'authorized') {
        setError(`Инстанс не авторизован (состояние: ${state?.stateInstance || 'неизвестно'}). Авторизуйте его в личном кабинете GREEN-API.`)
        return
      }
      onLogin(creds)
    } catch (err) {
      setError(`Не удалось подключиться: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">MAX</div>
        <h1 className="login__title">Вход через GREEN-API</h1>
        <p className="login__hint">
          Данные инстанса есть в <a href="https://console.green-api.com" target="_blank" rel="noreferrer">личном кабинете</a>
        </p>

        <label className="field">
          <span>idInstance</span>
          <input value={idInstance} onChange={(e) => setIdInstance(e.target.value)} placeholder="3100000000" inputMode="numeric" autoFocus />
        </label>
        <label className="field">
          <span>apiTokenInstance</span>
          <input value={apiTokenInstance} onChange={(e) => setApiTokenInstance(e.target.value)} placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd..." type="password" />
        </label>
        <label className="field">
          <span>apiUrl <em>(необязательно)</em></span>
          <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} placeholder={defaultApiUrl(idInstance)} />
        </label>

        {error && <div className="login__error">{error}</div>}

        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </div>
  )
}
