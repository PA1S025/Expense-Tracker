import {
  useEffect,
  useMemo,
  useState
} from 'react'

import ExpenseForm from './components/ExpenseForm'
import ExpenseList from './components/ExpenseList'
import Analytics from './components/Analytics'
import RecurringExpenses from './components/RecurringExpenses'
import CalendarView from './components/CalendarView'
import Notifications from './components/Notifications'
import Settings from './components/Settings'
import PinLock from './components/PinLock'
import Auth from './components/Auth'
import AIChat from './components/AIChat'

import {
  getExpenses,
  getBudgets,
  getRecurringExpenses,
  deleteBudget,
  saveBudget
} from './api'

import {
  DEFAULT_CATEGORIES
} from './utils'

import './App.css'


function App() {

  const [user, setUser] = useState(() => {
    try {
      const saved =
        localStorage.getItem('user')

      return saved
        ? JSON.parse(saved)
        : null

    } catch {
      return null
    }
  })


  const [loading, setLoading] =
    useState(true)


  const [expenses, setExpenses] =
    useState([])


  const [budgets, setBudgets] =
    useState({})


  const [recurringExpenses, setRecurringExpenses] =
    useState([])


  const [categories, setCategories] =
    useState(
      () => {
        try {
          const saved =
            localStorage.getItem(
              'categories'
            )

          return saved
            ? JSON.parse(saved)
            : DEFAULT_CATEGORIES

        } catch {
          return DEFAULT_CATEGORIES
        }
      }
    )


  const [notifications, setNotifications] =
    useState([])


  const [notificationEnabled, setNotificationEnabled] =
    useState(
      () => {
        const saved =
          localStorage.getItem(
            'notificationEnabled'
          )

        return saved === null
          ? true
          : JSON.parse(saved)
      }
    )


  const [pinEnabled, setPinEnabled] =
    useState(() => Boolean(localStorage.getItem('pinHash')))

  const [pinHashValue, setPinHashValue] =
    useState(() => localStorage.getItem('pinHash') || '')

  const [locked, setLocked] =
    useState(() => Boolean(localStorage.getItem('pinHash')))


  const [theme, setTheme] =
    useState(
      () =>
        localStorage.getItem(
          'theme'
        ) || 'system'
    )

  const [navTheme, setNavTheme] =
    useState(
      () =>
        localStorage.getItem('navTheme') || 'rail'
    )

  const [motionTheme, setMotionTheme] =
    useState(
      () =>
        localStorage.getItem('motionTheme') || 'rise'
    )


  const [activeView, setActiveView] =
    useState('overview')


  const [
    selectedMonthPart,
    setSelectedMonthPart
  ] = useState('')


  const [
    selectedYearPart,
    setSelectedYearPart
  ] = useState('')


  const [
    filterCategory,
    setFilterCategory
  ] = useState('all')


  const [
    searchText,
    setSearchText
  ] = useState('')

  const [budgetDraft, setBudgetDraft] =
    useState('')

  const [aiOpen, setAiOpen] =
    useState(false)


  /*
    -----------------------------------------
    LOAD USER DATA FROM BACKEND
    -----------------------------------------
  */

  const loadUserData = async () => {
    try {

      setLoading(true)

      const [
        expenseData,
        budgetData,
        recurringData
      ] = await Promise.all([
        getExpenses(),
        getBudgets(),
        getRecurringExpenses()
      ])


      setExpenses(
        expenseData.map(
          (expense) => ({
            ...expense,
            amount:
              Number(
                expense.amount
              ),

            paymentMethod:
              expense.payment_method ||
              '',

            recurringId:
              expense.recurring_id ||
              null,

            recurringDueDate:
              expense.recurring_due_date ||
              null
          })
        )
      )


      const budgetObject = {}

      budgetData.forEach(
        (budget) => {
          budgetObject[
            budget.month
          ] =
            budget.amount
        }
      )

      setBudgets(
        budgetObject
      )


      setRecurringExpenses(
        recurringData.map(
          (item) => ({
            ...item,

            amount:
              Number(
                item.amount
              ),

            startDate:
              item.start_date,

            nextDueDate:
              item.next_due_date,

            paymentMethod:
              item.payment_method ||
              '',

            active:
              item.active !== false
          })
        )
      )

    } catch (error) {

      console.error(
        'Failed to load data:',
        error
      )

      /*
        If authentication has expired,
        clear the local session.
      */

      if (
        error.message
          .toLowerCase()
          .includes('token') ||
        error.message
          .toLowerCase()
          .includes('authentication')
      ) {
        handleLogout()
      }

    } finally {

      setLoading(false)

    }
  }


  /*
    -----------------------------------------
    LOGIN
    -----------------------------------------
  */

  const handleLogin = (
    loggedInUser
  ) => {

    setUser(
      loggedInUser
    )

  }


  /*
    -----------------------------------------
    LOAD DATA AFTER LOGIN
    -----------------------------------------
  */

  useEffect(() => {

    if (!user) {
      setLoading(false)
      return
    }

    loadUserData()

  }, [user])


  /*
    -----------------------------------------
    LOCAL SETTINGS
    -----------------------------------------
  */

  useEffect(() => {
    localStorage.setItem(
      'categories',
      JSON.stringify(
        categories
      )
    )
  }, [categories])


  useEffect(() => {
    localStorage.setItem(
      'notificationEnabled',
      JSON.stringify(
        notificationEnabled
      )
    )
  }, [
    notificationEnabled
  ])


  useEffect(() => {
    localStorage.setItem(
      'theme',
      theme
    )
  }, [theme])

  useEffect(() => {
    localStorage.setItem('navTheme', navTheme)
  }, [navTheme])

  useEffect(() => {
    localStorage.setItem('motionTheme', motionTheme)
  }, [motionTheme])


  useEffect(() => {
    if (pinHashValue) {
      localStorage.setItem('pinHash', pinHashValue)
    } else {
      localStorage.removeItem('pinHash')
    }
  }, [pinHashValue])


  useEffect(() => {
    localStorage.removeItem('pinHash')
  }, [])


  useEffect(() => {

    document.documentElement.dataset.theme =
      theme

  }, [theme])


  /*
    -----------------------------------------
    MONTH / YEAR
    -----------------------------------------
  */

  const currentYear =
    new Date().getFullYear()


  const months = [
    ['01', 'Jan'],
    ['02', 'Feb'],
    ['03', 'Mar'],
    ['04', 'Apr'],
    ['05', 'May'],
    ['06', 'Jun'],
    ['07', 'Jul'],
    ['08', 'Aug'],
    ['09', 'Sep'],
    ['10', 'Oct'],
    ['11', 'Nov'],
    ['12', 'Dec']
  ]


  const yearOptions =
    Array.from(
      {
        length: 11
      },
      (_, i) =>
        currentYear - 5 + i
    )


  const selectedMonth =
    selectedYearPart &&
    selectedMonthPart
      ? `${selectedYearPart}-${selectedMonthPart}`
      : ''


  /*
    -----------------------------------------
    FILTER EXPENSES
    -----------------------------------------
  */

  const filteredExpenses =
    useMemo(
      () =>
        expenses.filter(
          (expense) => {

            const categoryOk =
              filterCategory ===
                'all' ||
              expense.category ===
                filterCategory


            const monthOk =
              !selectedMonth ||
              expense.date.startsWith(
                selectedMonth
              )


            const searchOk =
              `${expense.description} ${
                expense.notes || ''
              }`
                .toLowerCase()
                .includes(
                  searchText
                    .toLowerCase()
                )


            return (
              categoryOk &&
              monthOk &&
              searchOk
            )
          }
        ),

      [
        expenses,
        filterCategory,
        selectedMonth,
        searchText
      ]
    )


  const currentBudget =
    selectedMonth
      ? budgets[
          selectedMonth
        ] || ''
      : ''

  useEffect(() => {
    if (!selectedMonth) {
      setBudgetDraft('')
      return
    }

    setBudgetDraft(
      currentBudget === ''
        ? ''
        : String(currentBudget)
    )
  }, [selectedMonth, currentBudget])


  /*
    -----------------------------------------
    SAVE BUDGET TO BACKEND
    -----------------------------------------
  */

  const setCurrentBudget =
    async (value) => {

      if (!selectedMonth) {
        alert(
          'Please select a month first'
        )

        return
      }

      try {
        const normalizedValue =
          value === '' || value === null
            ? ''
            : String(value).trim()

        if (normalizedValue === '') {
          const existing =
            budgets[selectedMonth]

          if (existing !== undefined) {
            await deleteBudget(selectedMonth)
          }

          setBudgets((previous) => {
            const copy = { ...previous }
            delete copy[selectedMonth]
            return copy
          })

          setBudgetDraft('')
          return
        }

        const numericValue = Number(normalizedValue)

        if (!Number.isFinite(numericValue) || numericValue < 0) {
          alert('Budget must be a valid non-negative number')
          return
        }

        const response = await saveBudget(
          selectedMonth,
          numericValue
        )

        setBudgets((previous) => ({
          ...previous,
          [selectedMonth]:
            response.budget.amount
        }))

        setBudgetDraft(String(response.budget.amount))
      } catch (error) {
        alert(error.message)
      }
    }


  const clearCurrentBudget =
    async () => {

      if (!selectedMonth) {
        return
      }

      try {

        await deleteBudget(
          selectedMonth
        )

        setBudgets(
          (previous) => {

            const copy = {
              ...previous
            }

            delete copy[
              selectedMonth
            ]

            return copy
          }
        )

      } catch (error) {

        alert(
          error.message
        )

      }
    }


  /*
    -----------------------------------------
    NAVIGATION
    -----------------------------------------
  */

  const handleViewChange =
    (view) => {

      setActiveView(view)

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      })

    }


  /*
    -----------------------------------------
    FILTER CLEAR
    -----------------------------------------
  */

  const clearFilters = () => {

    setSelectedMonthPart(
      ''
    )

    setSelectedYearPart(
      ''
    )

    setFilterCategory(
      'all'
    )

    setSearchText(
      ''
    )

  }


  /*
    -----------------------------------------
    NOTIFICATIONS
    -----------------------------------------
  */

  const dismissNotification =
    (id) => {

      setNotifications(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !== id
          )
      )

    }


  const clearNotifications =
    () => {
      setNotifications([])
    }


  /*
    -----------------------------------------
    LOGOUT
    -----------------------------------------
  */

  const handleLogout = () => {

    localStorage.removeItem(
      'token'
    )

    localStorage.removeItem(
      'user'
    )

    setUser(null)

    setExpenses([])

    setBudgets({})

    setRecurringExpenses([])

    setNotifications([])

    setActiveView(
      'overview'
    )

  }


  /*
    -----------------------------------------
    PIN LOCK
    -----------------------------------------
  */

  const currentHour = new Date().getHours()
  const greeting = currentHour < 12
    ? 'Good morning'
    : currentHour < 18
      ? 'Good afternoon'
      : 'Good evening'
  const firstName = user.name ? user.name.split(' ')[0] : 'there'

  const viewCopy = {
    overview: {
      kicker: 'Spending overview',
      title: `${greeting}, ${firstName}`,
      subtitle: 'A calm snapshot of where your money went.'
    },
    'add-expense': {
      kicker: 'Capture',
      title: 'Add an expense',
      subtitle: 'Log a purchase and set this month’s budget target.'
    },
    analytics: {
      kicker: 'Insights',
      title: 'Spending analytics',
      subtitle: 'See patterns, categories, and how you track against budget.'
    },
    calendar: {
      kicker: 'Timeline',
      title: 'Calendar',
      subtitle: 'Browse expenses and recurring dues by day.'
    },
    recurring: {
      kicker: 'Automation',
      title: 'Recurring expenses',
      subtitle: 'Keep bills and subscriptions on a reliable schedule.'
    },
    notifications: {
      kicker: 'Alerts',
      title: 'Notifications',
      subtitle: 'Budget warnings and reminders, all in one place.'
    },
    settings: {
      kicker: 'Preferences',
      title: 'Settings',
      subtitle: 'Tune appearance, navigation, motion, and data tools.'
    }
  }[activeView]


  const overviewTotalSpent = useMemo(
    () => filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0),
    [filteredExpenses]
  )

  const overviewBudget = Number(currentBudget) || 0
  const overviewRemaining = overviewBudget - overviewTotalSpent

  const overviewTopCategory = useMemo(() => {
    const totals = {}
    filteredExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + Number(e.amount)
    })
    const entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
    return entries[0]?.[0] || 'N/A'
  }, [filteredExpenses])

  if (!user) {

    if (loading) {
      return (
        <div className="loading-screen">
          Loading...
        </div>
      )
    }

    return (
      <Auth
        onLogin={
          handleLogin
        }
      />
    )
  }

  if (locked) {
    return <PinLock pinHash={pinHashValue} onUnlock={() => setLocked(false)} />
  }

  /*
    -----------------------------------------
    NAVIGATION ITEMS
    -----------------------------------------
  */

  const navItems = [
    ['overview', 'Overview'],
    ['add-expense', 'Add Expense'],
    ['analytics', 'Analytics'],
    ['calendar', 'Calendar'],
    ['recurring', 'Recurring'],
    [
      'notifications',
      `Notifications${
        notifications.length
          ? ` (${notifications.length})`
          : ''
      }`
    ],
    ['settings', 'Settings']
  ]


  return (
    <div
      className="app"
      data-nav={navTheme}
      data-motion={motionTheme}
    >
      <div className="aurora-orbs" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="app-shell">

        <nav className="toolbar" data-active={activeView}>

          <div className="toolbar-brand">
            <div className="toolbar-mark">₹</div>
            <div>
              <div className="toolbar-title">Expense Tracker</div>
              <span className="toolbar-subtitle">Personal finance</span>
            </div>
          </div>

          <div className="toolbar-section-label">Workspace</div>

          <div className="toolbar-links">

            {navItems.map(
              ([view, label]) => (
                <button
                  key={view}
                  type="button"
                  data-view={view}
                  className={
                    activeView === view
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    handleViewChange(view)
                  }
                >
                  <span className={`nav-icon nav-icon-${view}`}>
                    {view === 'overview' ? '⌂' : view === 'add-expense' ? '+' : view === 'analytics' ? '◒' : view === 'calendar' ? '□' : view === 'recurring' ? '↻' : view === 'notifications' ? '!' : '⚙'}
                  </span>
                  <span>{label}</span>
                </button>
              )
            )}

          </div>

          <div className="sidebar-footer">
            <div className="sidebar-user">
              <div className="sidebar-user-avatar">
                {user.name
                  ? user.name
                      .split(' ')
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('')
                      .toUpperCase()
                  : 'U'}
              </div>
              <div>
                <strong>{user.name || 'User'}</strong>
                <span>{user.email || 'Account'}</span>
              </div>
            </div>

            <button
              className="logout-button"
              onClick={handleLogout}
            >
              Sign out
            </button>
          </div>

        </nav>

        <main className="app-main">


      <header className="app-header">
        <div className="page-hero">
          <div className="page-hero-copy">
            <span className="account-label">
              {viewCopy.kicker}
            </span>
            <h1>{viewCopy.title}</h1>
            <p>{viewCopy.subtitle}</p>
          </div>

          <div className="page-hero-aside">
            <div className="hero-chip">
              <span>Account</span>
              <strong>{user.name || 'User'}</strong>
            </div>
            <div className="hero-chip">
              <span>Email</span>
              <strong>{user.email || 'Not available'}</strong>
            </div>
          </div>
        </div>
      </header>


      <div key={activeView} className="view-container">
          {activeView === 'overview' && (
        <>
          <div className="quick-actions-bar">
            <button type="button" className="quick-action-btn primary" onClick={() => handleViewChange('add-expense')}>
              <span>+</span> Add Expense
            </button>
            <button type="button" className="quick-action-btn" onClick={() => handleViewChange('analytics')}>
              Analytics
            </button>
            <button type="button" className="quick-action-btn" onClick={() => handleViewChange('calendar')}>
              Calendar
            </button>
            <button type="button" className="quick-action-btn" onClick={() => handleViewChange('recurring')}>
              Recurring
            </button>
          </div>

          <div className="summary-grid">
            <div className="summary-card coral">
              <div className="summary-card-header">
                <span>Total Spent</span>
                <span className="summary-card-icon">₹</span>
              </div>
              <div className="summary-card-value">₹{overviewTotalSpent.toFixed(2)}</div>
              <div className="summary-card-sub">{filteredExpenses.length} transaction{filteredExpenses.length === 1 ? '' : 's'}</div>
            </div>

            <div className="summary-card blue">
              <div className="summary-card-header">
                <span>Monthly Budget</span>
                <span className="summary-card-icon" style={{ fontSize: '10px', fontWeight: 800 }}>TGT</span>
              </div>
              <div className="summary-card-value">
                {overviewBudget ? `₹${overviewBudget.toFixed(2)}` : 'Not Set'}
              </div>
              <div className="summary-card-sub">
                {selectedMonth ? `Target for ${selectedMonth}` : 'Select a month'}
              </div>
            </div>

            <div className="summary-card mint">
              <div className="summary-card-header">
                <span>Remaining</span>
                <span className="summary-card-icon" style={{ fontSize: '10px', fontWeight: 800 }}>REM</span>
              </div>
              <div className="summary-card-value">
                {overviewBudget ? `₹${overviewRemaining.toFixed(2)}` : 'N/A'}
              </div>
              <div className={`summary-card-sub ${overviewRemaining >= 0 ? 'positive' : 'negative'}`}>
                {overviewBudget
                  ? overviewRemaining >= 0
                    ? 'Within budget limit'
                    : 'Over budget limit'
                  : 'Set budget in Add Expense'}
              </div>
            </div>

            <div className="summary-card amber">
              <div className="summary-card-header">
                <span>Top Category</span>
                <span className="summary-card-icon" style={{ fontSize: '10px', fontWeight: 800 }}>TOP</span>
              </div>
              <div className="summary-card-value" style={{ textTransform: 'capitalize' }}>
                {overviewTopCategory}
              </div>
              <div className="summary-card-sub">Highest spending category</div>
            </div>
          </div>

          <section className="card filters">

            <div className="section-heading">

              <div>

                <h2>
                  Filters
                </h2>

                <p>
                  Filter your expenses
                  before viewing
                  the list.
                </p>

              </div>

            </div>


            <div className="filter-grid">

              <div className="field">

                <label>
                  Select Month
                </label>

                <div className="two-inputs">

                  <select
                    value={
                      selectedMonthPart
                    }
                    onChange={(e) =>
                      setSelectedMonthPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Month
                    </option>

                    {months.map(
                      ([
                        value,
                        label
                      ]) => (
                        <option
                          key={
                            value
                          }
                          value={
                            value
                          }
                        >
                          {label}
                        </option>
                      )
                    )}

                  </select>


                  <select
                    value={
                      selectedYearPart
                    }
                    onChange={(e) =>
                      setSelectedYearPart(
                        e.target.value
                      )
                    }
                  >

                    <option value="">
                      Year
                    </option>

                    {yearOptions.map(
                      (year) => (
                        <option
                          key={
                            year
                          }
                          value={
                            year
                          }
                        >
                          {year}
                        </option>
                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="field">

                <label>
                  Search
                </label>

                <input
                  placeholder="Search description or notes..."
                  value={
                    searchText
                  }
                  onChange={(e) =>
                    setSearchText(
                      e.target.value
                    )
                  }
                />

              </div>

            </div>


            <div className="filter-actions">
              <button
                className="secondary-button"
                onClick={
                  clearFilters
                }
              >
                Clear Filters
              </button>
            </div>

          </section>


          <ExpenseList
            expenses={
              filteredExpenses
            }
            setExpenses={
              setExpenses
            }
            filterCategory={
              filterCategory
            }
            setFilterCategory={
              setFilterCategory
            }
            categories={
              categories
            }
          />

        </>
      )}


          {activeView === 'add-expense' && (
        <div className="two-column-card-grid">
          <section className="card">
            <div className="section-heading">
              <div>
                <h2>Monthly Budget</h2>
                <p>Set a spending budget target for the selected month.</p>
              </div>
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
              <div className="field">
                <label className="field-label">
                  <span>Month & Year</span>
                  <span className="field-required">*</span>
                </label>
                <div className="two-inputs">
                  <select
                    value={selectedMonthPart}
                    onChange={(e) => setSelectedMonthPart(e.target.value)}
                  >
                    <option value="">Month</option>
                    {months.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYearPart}
                    onChange={(e) => setSelectedYearPart(e.target.value)}
                  >
                    <option value="">Year</option>
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field-label">
                  <span>Target Budget</span>
                </label>
                <div className="input-group">
                  <span className="input-prefix">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={selectedMonth ? '0.00' : 'Select month first'}
                    value={budgetDraft}
                    disabled={!selectedMonth}
                    onChange={(e) => setBudgetDraft(e.target.value)}
                  />
                </div>
              </div>

              {selectedMonth && (
                <div className="button-wrap budget-actions" style={{ marginTop: '8px' }}>
                  <button
                    type="button"
                    className="primary-button small"
                    onClick={() => setCurrentBudget(budgetDraft)}
                    disabled={!selectedMonth}
                  >
                    Save Budget
                  </button>

                  {currentBudget !== '' && (
                    <button
                      type="button"
                      className="danger-button small budget-clear"
                      onClick={clearCurrentBudget}
                    >
                      Clear Budget
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          <ExpenseForm
            expenses={expenses}
            setExpenses={setExpenses}
            selectedMonth={selectedMonth}
            categories={categories}
          />
        </div>
      )}


          {activeView ===
        'analytics' && (

        <Analytics
          expenses={
            filteredExpenses
          }
          budget={
            currentBudget
          }
          selectedMonth={
            selectedMonth
          }
        />

      )}


          {activeView ===
        'calendar' && (

        <CalendarView
          expenses={
            expenses
          }
          recurringExpenses={
            recurringExpenses
          }
        />

      )}


          {activeView ===
        'recurring' && (

        <RecurringExpenses
          recurringExpenses={
            recurringExpenses
          }
          setRecurringExpenses={
            setRecurringExpenses
          }
          expenses={
            expenses
          }
          setExpenses={
            setExpenses
          }
          categories={
            categories
          }
        />

      )}


          {activeView ===
        'notifications' && (

        <Notifications
          notifications={
            notifications
          }
          dismissNotification={
            dismissNotification
          }
          clearNotifications={
            clearNotifications
          }
        />

      )}


          {activeView ===
        'settings' && (

        <Settings
          categories={
            categories
          }
          setCategories={
            setCategories
          }
          notificationEnabled={
            notificationEnabled
          }
          setNotificationEnabled={
            setNotificationEnabled
          }
          pinEnabled={
            pinEnabled
          }
          setPinEnabled={
            setPinEnabled
          }
          setPinHash={
            setPinHashValue
          }
          expenses={
            expenses
          }
          setExpenses={
            setExpenses
          }
          budgets={
            budgets
          }
          setBudgets={
            setBudgets
          }
          recurringExpenses={
            recurringExpenses
          }
          setRecurringExpenses={
            setRecurringExpenses
          }
          theme={
            theme
          }
          setTheme={
            setTheme
          }
          navTheme={navTheme}
          setNavTheme={setNavTheme}
          motionTheme={motionTheme}
          setMotionTheme={setMotionTheme}
          onLogout={
            handleLogout
          }
        />

      )}
      </div>

        </main>

      </div>

      <nav className="mobile-dock" aria-label="Primary">
        {navItems.map(([view, label]) => (
          <button
            key={view}
            type="button"
            className={activeView === view ? 'active' : ''}
            onClick={() => handleViewChange(view)}
          >
            <span className="nav-icon">
              {view === 'overview' ? '⌂' : view === 'add-expense' ? '+' : view === 'analytics' ? '◒' : view === 'calendar' ? '□' : view === 'recurring' ? '↻' : view === 'notifications' ? '!' : '⚙'}
            </span>
            <span>{label.replace(/ \(\d+\)$/, '')}</span>
          </button>
        ))}
      </nav>

      <div className="ai-assistant-dock">

        {aiOpen && (
          <div className="ai-assistant-popover">
            <div className="ai-popover-heading">
              <div>
                <span className="ai-popover-eyebrow">Your money sidekick</span>
                <strong>Ask the assistant</strong>
              </div>

              <button
                className="ai-close-button"
                type="button"
                aria-label="Close AI assistant"
                onClick={() => setAiOpen(false)}
              >
                ×
              </button>
            </div>

            <AIChat
            selectedMonth={selectedMonth}
            selectedYear={selectedYearPart}
            budget={overviewBudget}
            totalSpent={overviewTotalSpent}
            remaining={overviewRemaining}
            topCategory={overviewTopCategory}
            expenseCount={filteredExpenses.length}
            expenseSummary={{
              totalSpent: overviewTotalSpent,
              budget: overviewBudget,
              remaining: overviewRemaining,
              topCategory: overviewTopCategory,
              count: filteredExpenses.length,
              month: selectedMonth || `${selectedYearPart || new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
            }}
            expenses={filteredExpenses}
          />
          </div>
        )}

        <button
          className={`ai-fab ${aiOpen ? 'is-open' : ''}`}
          type="button"
          aria-expanded={aiOpen}
          aria-label={aiOpen ? 'Close AI assistant' : 'Open AI assistant'}
          title={aiOpen ? 'Close AI assistant' : 'Ask your money sidekick'}
          onClick={() => setAiOpen((open) => !open)}
        >
          <span className="ai-fab-icon">✦</span>
          <span className="ai-fab-label">Ask AI</span>
        </button>

      </div>

    </div>
  )
}

export default App