import { useRef, useState } from 'react'
import * as XLSX from 'xlsx'
import { DEFAULT_CATEGORIES, downloadBlob, hashPin } from '../utils'

function Settings({
  categories,
  setCategories,
  notificationEnabled,
  setNotificationEnabled,
  pinEnabled,
  setPinEnabled,
  setPinHash,
  expenses,
  setExpenses,
  budgets,
  setBudgets,
  recurringExpenses,
  setRecurringExpenses,
  theme,
  setTheme
}) {
  const [newCategory, setNewCategory] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const fileInputRef = useRef(null)

  const addCategory = () => {
    const value = newCategory.trim().toLowerCase()
    if (!value) return
    if (categories.includes(value)) return alert('Category already exists.')
    setCategories((previous) => [...previous, value])
    setNewCategory('')
  }

  const removeCategory = (category) => {
    if (DEFAULT_CATEGORIES.includes(category)) return alert('Default categories cannot be removed.')
    if (!window.confirm(`Delete category "${category}"? Existing expenses keep their category.`)) return
    setCategories((previous) => previous.filter((item) => item !== category))
  }

  const enablePin = async () => {
    if (!/^\d{4,6}$/.test(pin)) return alert('PIN must contain 4 to 6 digits.')
    if (pin !== pinConfirm) return alert('PINs do not match.')
    setPinHash(await hashPin(pin))
    setPinEnabled(true)
    setPin('')
    setPinConfirm('')
    alert('App PIN enabled.')
  }

  const disablePin = () => {
    if (!window.confirm('Disable app lock?')) return
    setPinEnabled(false)
    setPinHash('')
  }

  const exportJSON = () => {
    const data = { expenses, budgets, recurringExpenses, categories }
    downloadBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), `expense-backup-${Date.now()}.json`)
  }

  const exportCSV = () => {
    const rows = expenses.map((expense) => ({
      amount: expense.amount,
      category: expense.category,
      description: expense.description,
      date: expense.date,
      paymentMethod: expense.paymentMethod || '',
      notes: expense.notes || '',
      recurringId: expense.recurringId || ''
    }))
    const sheet = XLSX.utils.json_to_sheet(rows)
    downloadBlob(new Blob([XLSX.utils.sheet_to_csv(sheet)], { type: 'text/csv;charset=utf-8' }), `expenses-${Date.now()}.csv`)
  }

  const exportExcel = () => {
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(expenses), 'Expenses')
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.json_to_sheet(Object.entries(budgets).map(([month, amount]) => ({ month, budget: amount }))),
      'Budgets'
    )
    XLSX.writeFile(workbook, `expense-backup-${Date.now()}.xlsx`)
  }

  const importJSON = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!Array.isArray(data.expenses)) throw new Error('Invalid backup')
        setExpenses(data.expenses)
        setBudgets(data.budgets || {})
        setRecurringExpenses(data.recurringExpenses || [])
        setCategories(data.categories?.length ? data.categories : DEFAULT_CATEGORIES)
        alert('Backup imported successfully.')
      } catch {
        alert('Invalid JSON backup file.')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const resetAll = () => {
    if (!window.confirm('This will permanently delete all app data. Continue?')) return
    setExpenses([])
    setBudgets({})
    setRecurringExpenses([])
    setCategories(DEFAULT_CATEGORIES)
    localStorage.clear()
    window.location.reload()
  }

  return (
    <section className="settings-console">
      <header className="settings-console-header">
        <span>Application Preferences</span>
        <h2>Settings</h2>
        <p>Manage your preferences and application data.</p>
      </header>

      <div className="settings-grid-layout">
        {/* CARD 1: PREFERENCES (APPEARANCE & NOTIFICATIONS) */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span>Section 1</span>
            <h3>Preferences & Theme</h3>
            <p>Appearance and notification alerts.</p>
          </div>
          <div className="settings-console-rows">
            <div className="settings-console-row">
              <div>
                <strong>Theme Mode</strong>
                <small>Light, Dark, or System preference</small>
              </div>
              <select value={theme} onChange={(event) => setTheme(event.target.value)}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="settings-console-row">
              <div>
                <strong>Notifications</strong>
                <small>In-app and browser notifications</small>
              </div>
              <label className="settings-switch" aria-label="Toggle notifications">
                <input
                  className="settings-toggle"
                  type="checkbox"
                  checked={notificationEnabled}
                  onChange={(event) => setNotificationEnabled(event.target.checked)}
                />
                <span className="settings-switch-track" aria-hidden="true">
                  <span />
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* CARD 2: APP LOCK / SECURITY */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span>Section 2</span>
            <h3>App Lock & Security</h3>
            <p>Passcode protection for local application lock.</p>
          </div>
          {pinEnabled ? (
            <div className="settings-lock-enabled">
              <div>
                <strong>PIN protection is enabled.</strong>
                <small style={{ display: 'block', color: 'var(--secondary-text)', marginTop: '4px' }}>
                  Passcode required upon app start.
                </small>
              </div>
              <button className="danger-button small" type="button" onClick={disablePin} style={{ marginTop: '12px' }}>
                Disable PIN
              </button>
            </div>
          ) : (
            <div className="settings-pin-form">
              <div className="field">
                <label className="field-label"><span>PIN Code</span></label>
                <input
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="4–6 digits"
                  value={pin}
                  onChange={(event) => setPin(event.target.value.replace(/\D/g, ''))}
                />
              </div>
              <div className="field">
                <label className="field-label"><span>Confirm</span></label>
                <input
                  inputMode="numeric"
                  maxLength="6"
                  placeholder="Confirm PIN"
                  value={pinConfirm}
                  onChange={(event) => setPinConfirm(event.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button className="primary-button small" type="button" onClick={enablePin}>
                Enable PIN
              </button>
            </div>
          )}
        </div>

        {/* CARD 3: EXPENSE CATEGORIES */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span>Section 3</span>
            <h3>Expense Categories</h3>
            <p>Manage custom spending categories.</p>
          </div>
          <div className="settings-category-list">
            {categories.map((category) => (
              <span className="settings-category-pill" key={category}>
                {category}
                {!DEFAULT_CATEGORIES.includes(category) && (
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    aria-label={`Remove ${category}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
          <div className="settings-category-add" style={{ marginTop: '12px' }}>
            <input
              placeholder="New category name"
              value={newCategory}
              onChange={(event) => setNewCategory(event.target.value)}
            />
            <button className="primary-button small" type="button" onClick={addCategory}>
              Add
            </button>
          </div>
        </div>

        {/* CARD 4: DATA & BACKUP */}
        <div className="settings-card">
          <div className="settings-card-header">
            <span>Section 4</span>
            <h3>Data Backup & Export</h3>
            <p>Export financial history or import JSON backups.</p>
          </div>
          <div className="settings-data-group">
            <div className="settings-data-actions" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <button className="secondary-button small" type="button" onClick={exportJSON}>
                Export JSON
              </button>
              <button className="secondary-button small" type="button" onClick={exportCSV}>
                Export CSV
              </button>
              <button className="secondary-button small" type="button" onClick={exportExcel}>
                Export Excel
              </button>
              <button className="secondary-button small" type="button" onClick={() => fileInputRef.current?.click()}>
                Import JSON
              </button>
              <input ref={fileInputRef} hidden type="file" accept=".json" onChange={importJSON} />
            </div>
          </div>
        </div>

        {/* CARD 5: DANGER ZONE (FULL WIDTH) */}
        <div className="settings-card settings-card-full settings-danger-zone">
          <div className="settings-card-header">
            <span>Section 5 — Danger Zone</span>
            <h3 style={{ color: 'var(--danger)' }}>Reset Application</h3>
            <p>Permanently erase all expenses, budgets, recurring rules, and local preferences.</p>
          </div>
          <div>
            <button className="danger-button" type="button" onClick={resetAll}>
              Reset Application Data
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Settings
