const pool = require('../db')


// =====================================================
// GET CURRENT MONTH EXPENSES
// =====================================================

const getCurrentMonthExpenses = async (userId) => {

  const result = await pool.query(
    `
    SELECT
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method
    FROM expenses
    WHERE user_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
    ORDER BY date DESC, id DESC
    `,
    [userId]
  )

  return result.rows
}


const getExpensesForMonth = async (userId, month) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    throw new Error('Month must be in YYYY-MM format')
  }

  const startDate = `${month}-01`
  const [year, monthNumber] = month.split('-').map(Number)
  const nextMonth = new Date(year, monthNumber, 1)
  const nextMonthLabel = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

  const result = await pool.query(
    `
    SELECT
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method
    FROM expenses
    WHERE user_id = $1
      AND date >= $2::date
      AND date < ($3 || '-01')::date
    ORDER BY date DESC, id DESC
    `,
    [userId, startDate, nextMonthLabel]
  )

  return result.rows
}


// =====================================================
// GET EXPENSES BY DATE RANGE
// =====================================================

const getExpensesByDateRange = async (
  userId,
  startDate,
  endDate
) => {

  const result = await pool.query(
    `
    SELECT
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method
    FROM expenses
    WHERE user_id = $1
      AND date >= $2
      AND date <= $3
    ORDER BY date DESC, id DESC
    `,
    [
      userId,
      startDate,
      endDate
    ]
  )

  return result.rows
}


// =====================================================
// GET EXPENSE SUMMARY
// =====================================================

const getExpenseSummary = async (userId) => {

  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS expense_count,
      COALESCE(
        SUM(amount),
        0
      )::numeric AS total_spent
    FROM expenses
    WHERE user_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
    `,
    [userId]
  )


  const categoryResult = await pool.query(
    `
    SELECT
      category,
      COALESCE(
        SUM(amount),
        0
      )::numeric AS total
    FROM expenses
    WHERE user_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
    GROUP BY category
    ORDER BY total DESC
    `,
    [userId]
  )


  return {

    totalSpent:
      Number(
        result.rows[0].total_spent
      ),

    expenseCount:
      Number(
        result.rows[0].expense_count
      ),

    byCategory:
      categoryResult.rows.map(
        row => ({
          category:
            row.category,

          total:
            Number(row.total)
        })
      )

  }
}


const getExpenseSummaryForMonth = async (userId, month) => {
  if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
    throw new Error('Month must be in YYYY-MM format')
  }

  const startDate = `${month}-01`
  const [year, monthNumber] = month.split('-').map(Number)
  const nextMonth = new Date(year, monthNumber, 1)
  const nextMonthLabel = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`

  const result = await pool.query(
    `
    SELECT
      COUNT(*)::int AS expense_count,
      COALESCE(SUM(amount), 0)::numeric AS total_spent
    FROM expenses
    WHERE user_id = $1
      AND date >= $2::date
      AND date < ($3 || '-01')::date
    `,
    [userId, startDate, nextMonthLabel]
  )

  const categoryResult = await pool.query(
    `
    SELECT
      category,
      COALESCE(SUM(amount), 0)::numeric AS total
    FROM expenses
    WHERE user_id = $1
      AND date >= $2::date
      AND date < ($3 || '-01')::date
    GROUP BY category
    ORDER BY total DESC
    `,
    [userId, startDate, nextMonthLabel]
  )

  return {
    month,
    totalSpent: Number(result.rows[0].total_spent),
    expenseCount: Number(result.rows[0].expense_count),
    byCategory: categoryResult.rows.map((row) => ({
      category: row.category,
      total: Number(row.total)
    }))
  }
}


// =====================================================
// GET EXPENSES BY CATEGORY
// =====================================================

const getExpensesByCategory = async (
  userId,
  category
) => {

  const result = await pool.query(
    `
    SELECT
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method
    FROM expenses
    WHERE user_id = $1
      AND LOWER(category) = LOWER($2)
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
    ORDER BY date DESC, id DESC
    `,
    [
      userId,
      category
    ]
  )

  return result.rows
}


// =====================================================
// GET TOP EXPENSES
// =====================================================

const getTopExpenses = async (
  userId,
  limit = 5
) => {

  const safeLimit =
    Math.min(
      Math.max(
        Number(limit) || 5,
        1
      ),
      20
    )


  const result = await pool.query(
    `
    SELECT
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method
    FROM expenses
    WHERE user_id = $1
      AND date >= DATE_TRUNC('month', CURRENT_DATE)
      AND date < DATE_TRUNC('month', CURRENT_DATE)
        + INTERVAL '1 month'
    ORDER BY amount DESC, id DESC
    LIMIT $2
    `,
    [
      userId,
      safeLimit
    ]
  )

  return result.rows
}


// =====================================================
// ADD EXPENSE
// =====================================================

const addExpense = async (
  userId,
  amount,
  category,
  description,
  date,
  notes = null,
  paymentMethod = null
) => {

  const result = await pool.query(
    `
    INSERT INTO expenses (
      user_id,
      amount,
      category,
      description,
      date,
      notes,
      payment_method
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7
    )
    RETURNING
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method,
      created_at,
      updated_at
    `,
    [
      userId,
      Number(amount),
      String(category).trim(),
      String(description).trim(),
      date,
      notes
        ? String(notes).trim()
        : null,
      paymentMethod
        ? String(paymentMethod).trim()
        : null
    ]
  )

  return result.rows[0]
}


// =====================================================
// UPDATE EXPENSE
// =====================================================

const updateExpense = async (
  userId,
  expenseId,
  amount,
  category,
  description,
  date,
  notes = null,
  paymentMethod = null
) => {

  const result = await pool.query(
    `
    UPDATE expenses
    SET
      amount = $1,
      category = $2,
      description = $3,
      date = $4,
      notes = $5,
      payment_method = $6,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $7
      AND user_id = $8
    RETURNING
      id,
      amount,
      category,
      description,
      TO_CHAR(date, 'YYYY-MM-DD') AS date,
      notes,
      payment_method,
      created_at,
      updated_at
    `,
    [
      Number(amount),
      String(category).trim(),
      String(description).trim(),
      date,
      notes
        ? String(notes).trim()
        : null,
      paymentMethod
        ? String(paymentMethod).trim()
        : null,
      expenseId,
      userId
    ]
  )


  if (result.rows.length === 0) {

    throw new Error(
      'Expense not found'
    )

  }


  return result.rows[0]
}


// =====================================================
// DELETE EXPENSE
// =====================================================

const deleteExpense = async (
  userId,
  expenseId
) => {

  const result = await pool.query(
    `
    DELETE FROM expenses
    WHERE id = $1
      AND user_id = $2
    RETURNING id
    `,
    [
      expenseId,
      userId
    ]
  )


  if (result.rows.length === 0) {

    throw new Error(
      'Expense not found'
    )

  }


  return {

    deletedId:
      result.rows[0].id

  }
}


// =====================================================
// EXPORTS
// =====================================================

module.exports = {

  getCurrentMonthExpenses,

  getExpensesForMonth,

  getExpensesByDateRange,

  getExpenseSummary,

  getExpenseSummaryForMonth,

  getExpensesByCategory,

  getTopExpenses,

  addExpense,

  updateExpense,

  deleteExpense

}