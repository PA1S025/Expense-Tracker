import { useState } from 'react'
import { hashPin } from '../utils'

function PinLock({ pinHash, onUnlock }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    if (!/^\d{4,6}$/.test(pin)) {
      setError('Enter your 4–6 digit PIN.')
      return
    }

    if (await hashPin(pin) === pinHash) {
      setError('')
      setPin('')
      onUnlock()
      return
    }

    setPin('')
    setError('Incorrect PIN.')
  }

  return (
    <div className="lock-screen">
      <form className="lock-card" onSubmit={submit}>
        <span className="account-label" style={{ marginBottom: '12px' }}>Security Lock</span>
        <h1>Expense Tracker Locked</h1>
        <p>Enter your PIN to continue.</p>
        <input autoFocus inputMode="numeric" type="password" maxLength="6" value={pin}
          onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))} placeholder="PIN" />
        {error && <div className="form-error">{error}</div>}
        <button className="primary-button" type="submit">Unlock</button>
      </form>
    </div>
  )
}

export default PinLock