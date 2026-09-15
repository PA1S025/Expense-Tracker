function Analytics({ expenses, budget, selectedMonth }) {
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0)
  const uniqueDays = new Set(expenses.map((expense) => expense.date)).size
  const averagePerDay = uniqueDays ? total / uniqueDays : 0
  const budgetAmount = Number(budget) || 0
  const remaining = budgetAmount - total
  const budgetPercent = budgetAmount ? (total / budgetAmount) * 100 : 0
  
  const categoryTotals = {}
  const paymentTotals = {}
  const dailyTotals = {}
  
  expenses.forEach((expense) => {
    const amount = Number(expense.amount)
    const paymentMethod = expense.paymentMethod || 'UPI'
  
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + amount
    paymentTotals[paymentMethod] = (paymentTotals[paymentMethod] || 0) + amount
    dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + amount
  })
  
  const categoryEntries = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])
  const paymentEntries = Object.entries(paymentTotals).sort((a, b) => b[1] - a[1])
  const trendEntries = Object.entries(dailyTotals)
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(-14)
  const topExpenses = [...expenses]
    .sort((expenseA, expenseB) => Number(expenseB.amount) - Number(expenseA.amount))
    .slice(0, 5)
  const maxCategory = categoryEntries[0]?.[1] || 1
  const maxTrend = Math.max(...trendEntries.map(([, amount]) => amount), 1)
  const topCategory = categoryEntries[0]?.[0] || 'No data yet'
  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'All activity'
  
  return (
    <section className="analytics-dashboard">
      <header className="analytics-dashboard-header">
        <div>
          <span className="analytics-dashboard-kicker">Financial Insights</span>
          <h2>Analytics</h2>
          <p>Understand where your money goes.</p>
        </div>
        <div className="analytics-month-pill" aria-label={`Selected period: ${monthLabel}`}>
          <span>Period:</span>
          <strong>{monthLabel}</strong>
        </div>
      </header>
  
      <div className="analytics-metric-strip">
        <div className="analytics-metric is-coral">
          <span>Total spent</span>
          <strong>₹{total.toFixed(2)}</strong>
          <small>{expenses.length} transaction{expenses.length === 1 ? '' : 's'}</small>
        </div>
        <div className="analytics-metric">
          <span>Average / day</span>
          <strong>₹{averagePerDay.toFixed(2)}</strong>
          <small>{uniqueDays || 0} active day{uniqueDays === 1 ? '' : 's'}</small>
        </div>
        <div className="analytics-metric">
          <span>Budget Used</span>
          <strong>{budgetAmount ? `${Math.round(budgetPercent)}%` : 'No budget'}</strong>
          <small>{budgetAmount ? (remaining >= 0 ? `₹${remaining.toFixed(2)} remaining` : 'Over limit') : 'Set one in Add Expense'}</small>
        </div>
        <div className="analytics-metric">
          <span>Top category</span>
          <strong style={{ textTransform: 'capitalize' }}>{topCategory}</strong>
          <small>{categoryEntries[0] ? `₹${categoryEntries[0][1].toFixed(2)} spent` : 'No category data'}</small>
        </div>
      </div>
  
      <div className="analytics-primary-grid">
        <section className="analytics-surface analytics-activity">
          <div className="analytics-surface-heading">
            <div>
              <h3>Spending Trend</h3>
              <p>Track how your spending changes over time.</p>
            </div>
            <strong>₹{total.toFixed(2)}</strong>
          </div>
  
          {trendEntries.length === 0 ? (
            <div className="empty-state">
              <strong>No spending activity yet</strong>
              <p>Add your first expense to see your spending pattern here.</p>
            </div>
          ) : (
            <div className={`analytics-chart ${trendEntries.length === 1 ? 'is-sparse' : ''}`}>
              {trendEntries.map(([date, amount]) => (
                <div className="analytics-chart-column" key={date} title={`${date}: ₹${amount.toFixed(2)}`}>
                  <strong>₹{amount.toFixed(0)}</strong>
                  <div className="analytics-chart-bar" style={{ height: `${Math.max((amount / maxTrend) * 100, 14)}%` }} />
                  <span>{date.slice(5)}</span>
                </div>
              ))}
            </div>
          )}
  
          {trendEntries.length === 1 && (
            <p className="analytics-helper" style={{ fontSize: '11px', color: 'var(--secondary-text)', marginTop: '8px' }}>
              One transaction recorded on {trendEntries[0][0]}.
            </p>
          )}
        </section>
  
        <section className="analytics-surface analytics-category">
          <div className="analytics-surface-heading">
            <div>
              <h3>Category Breakdown</h3>
              <p>Where your money is going.</p>
            </div>
          </div>
          {categoryEntries.length === 0 ? (
            <div className="empty-state"><span>No category data yet.</span></div>
          ) : categoryEntries.slice(0, 5).map(([category, amount]) => (
            <div className="analytics-category-row" key={category}>
              <div><strong style={{ textTransform: 'capitalize' }}>{category}</strong><b>₹{amount.toFixed(2)}</b></div>
              <div className="analytics-progress"><span style={{ width: `${(amount / maxCategory) * 100}%` }} /></div>
              <small style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>{total ? ((amount / total) * 100).toFixed(1) : 0}%</small>
            </div>
          ))}
        </section>
      </div>
  
      <div className="analytics-secondary-grid">
        <section className={`analytics-surface analytics-budget ${!budgetAmount ? 'is-unset' : ''}`}>
          <div className="analytics-surface-heading">
            <div>
              <h3>Budget Health</h3>
              <p>{budgetAmount ? 'Your monthly spending guardrail.' : 'Set a monthly budget to track progress.'}</p>
            </div>
          </div>
          {budgetAmount ? (
            <>
              <div className="analytics-budget-values">
                <span><small>Budget</small><b>₹{budgetAmount.toFixed(2)}</b></span>
                <span><small>Spent</small><b>₹{total.toFixed(2)}</b></span>
                <span><small>Remaining</small><b className={remaining < 0 ? 'is-negative' : 'is-positive'}>₹{Math.abs(remaining).toFixed(2)}</b></span>
              </div>
              <div className="analytics-budget-track"><span className={remaining < 0 ? 'is-over' : ''} style={{ width: `${Math.min(budgetPercent, 100)}%` }} /></div>
              <small className="analytics-budget-caption" style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>
                {Math.round(budgetPercent)}% of budget used
              </small>
            </>
          ) : (
            <div className="empty-state"><strong>No budget set</strong><p>You can add one from the Add Expense page.</p></div>
          )}
        </section>
  
        <section className="analytics-surface analytics-top-expenses">
          <div className="analytics-surface-heading">
            <div>
              <h3>Top Expenses</h3>
              <p>Your largest transactions this month.</p>
            </div>
          </div>
          {topExpenses.length === 0 ? (
            <div className="empty-state"><span>No expenses yet.</span></div>
          ) : topExpenses.map((expense) => (
            <div className="analytics-expense-row" key={expense.id}>
              <span className="analytics-expense-dot" />
              <div><strong>{expense.description}</strong><small>{expense.category} · {expense.date}</small></div>
              <b>₹{Number(expense.amount).toFixed(2)}</b>
            </div>
          ))}
        </section>
      </div>
  
      <section className="analytics-surface analytics-payments">
        <div className="analytics-surface-heading">
          <div>
            <h3>Payment Methods</h3>
            <p>How you pay across expenses.</p>
          </div>
        </div>
        {paymentEntries.length === 0 ? (
          <div className="empty-state"><span>No payment data yet.</span></div>
        ) : (
          <div className="analytics-payment-list">
            {paymentEntries.map(([method, amount]) => (
              <div className="analytics-payment-row" key={method}>
                <div><strong>{method}</strong><span>₹{amount.toFixed(2)}</span></div>
                <div className="analytics-progress"><span style={{ width: `${total ? (amount / total) * 100 : 0}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default Analytics
