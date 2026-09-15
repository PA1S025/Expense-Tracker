const express = require('express')
const cors = require('cors')
const path = require('path')

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true
})

const pool = require('./db')

const authRoutes =
  require('./routes/auth')

const expenseRoutes =
  require('./routes/expenses')

const budgetRoutes =
  require('./routes/budgets')

const recurringRoutes =
  require('./routes/recurring')

const aiRoutes =
  require('./routes/ai')

const authenticateToken =
  require('./middleware/authMiddleware')

const processRecurringExpenses =
  require('./recurringProcessor')


const app = express()


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(cors())

app.use(express.json())


// =====================================================
// ROUTES
// =====================================================

app.use(
  '/api/auth',
  authRoutes
)

app.use(
  '/api/expenses',
  expenseRoutes
)

app.use(
  '/api/budgets',
  budgetRoutes
)

app.use(
  '/api/recurring',
  recurringRoutes
)

app.use(
  '/api/ai',
  aiRoutes
)


// =====================================================
// ROOT
// =====================================================

app.get('/', (req, res) => {

  res.json({
    message:
      'Expense Tracker API is running'
  })

})


// =====================================================
// DATABASE TEST
// =====================================================

app.get(
  '/api/test-db',
  async (req, res) => {

    try {

      const result =
        await pool.query(
          'SELECT NOW()'
        )

      res.json({

        message:
          'Database connected successfully',

        time:
          result.rows[0].now

      })

    } catch (error) {

      console.error(
        'Database test error:',
        error
      )

      res.status(500).json({

        message:
          'Database connection failed'

      })

    }

  }
)


// =====================================================
// PROTECTED TEST ROUTE
// =====================================================

app.get(
  '/api/protected',
  authenticateToken,
  (req, res) => {

    res.json({

      message:
        'You accessed a protected route',

      user:
        req.user

    })

  }
)


// =====================================================
// SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000


const startServer = async () => {

  try {

    // Test PostgreSQL connection
    await pool.query(
      'SELECT 1'
    )

    console.log(
      'Connected to PostgreSQL'
    )


    // Start Express server
    app.listen(
      PORT,
      () => {

        console.log(
          `Server running on http://localhost:${PORT}`
        )

      }
    )


    // Process recurring expenses
    await processRecurringExpenses()


    // Check every 60 seconds
    setInterval(
      processRecurringExpenses,
      60 * 1000
    )


  } catch (error) {

    console.error(
      'Failed to start server:',
      error
    )

    process.exit(1)

  }

}


startServer()