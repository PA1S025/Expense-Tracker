const {
  McpServer
} = require(
  '@modelcontextprotocol/sdk/server/mcp.js'
)

const {
  StdioServerTransport
} = require(
  '@modelcontextprotocol/sdk/server/stdio.js'
)

const {
  z
} = require('zod')


const {
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
} = require(
  '../services/expenseTools'
)


const server =
  new McpServer({

    name:
      'expense-tracker',

    version:
      '1.0.0'

  })


// =====================================================
// GET CURRENT MONTH EXPENSES
// =====================================================

server.tool(

  'get_current_month_expenses',

  'Get all expenses for the authenticated user in the current month.',

  {
    userId:
      z.number().int()
  },

  async ({ userId }) => {

    try {

      const expenses =
        await getCurrentMonthExpenses(
          userId
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expenses,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'get_current_month_expenses:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              'Failed to retrieve current month expenses.'
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// GET EXPENSES FOR SELECTED MONTH
// =====================================================

server.tool(

  'get_expenses_for_month',

  'Get all expenses for a specific month for the authenticated user. Use this when the user has selected a month or year in the UI.',

  {
    userId: z.number().int(),
    month: z.string().regex(/^\d{4}-\d{2}$/)
  },

  async ({ userId, month }) => {
    try {
      const expenses = await getExpensesForMonth(userId, month)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(expenses, null, 2)
        }]
      }
    } catch (error) {
      console.error('get_expenses_for_month:', error)
      return {
        content: [{ type: 'text', text: `Failed to retrieve expenses for ${month}: ${error.message}` }],
        isError: true
      }
    }
  }
)


// =====================================================
// GET EXPENSE SUMMARY FOR SELECTED MONTH
// =====================================================

server.tool(

  'get_expense_summary_for_month',

  'Get total spending, category breakdown, and count for a specific month. Use this when the user asks about the selected month or year.',

  {
    userId: z.number().int(),
    month: z.string().regex(/^\d{4}-\d{2}$/)
  },

  async ({ userId, month }) => {
    try {
      const summary = await getExpenseSummaryForMonth(userId, month)

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(summary, null, 2)
        }]
      }
    } catch (error) {
      console.error('get_expense_summary_for_month:', error)
      return {
        content: [{ type: 'text', text: `Failed to retrieve summary for ${month}: ${error.message}` }],
        isError: true
      }
    }
  }
)


// =====================================================
// GET EXPENSES BY DATE RANGE
// =====================================================

server.tool(

  'get_expenses_by_date_range',

  'Get expenses between two dates for a user.',

  {

    userId:
      z.number().int(),

    startDate:
      z.string().min(1),

    endDate:
      z.string().min(1)

  },

  async ({
    userId,
    startDate,
    endDate
  }) => {

    try {

      const expenses =
        await getExpensesByDateRange(
          userId,
          startDate,
          endDate
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expenses,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'get_expenses_by_date_range:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              'Failed to retrieve expenses for the date range.'
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// GET EXPENSE SUMMARY
// =====================================================

server.tool(

  'get_expense_summary',

  'Get total spending, expense count, and category breakdown for the current month.',

  {

    userId:
      z.number().int()

  },

  async ({ userId }) => {

    try {

      const summary =
        await getExpenseSummary(
          userId
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                summary,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'get_expense_summary:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              'Failed to retrieve expense summary.'
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// GET EXPENSES BY CATEGORY
// =====================================================

server.tool(

  'get_expenses_by_category',

  'Get current month expenses belonging to a specific category.',

  {

    userId:
      z.number().int(),

    category:
      z.string().min(1)

  },

  async ({
    userId,
    category
  }) => {

    try {

      const expenses =
        await getExpensesByCategory(
          userId,
          category
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expenses,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'get_expenses_by_category:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              'Failed to retrieve category expenses.'
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// GET TOP EXPENSES
// =====================================================

server.tool(

  'get_top_expenses',

  'Get the largest expenses for the current month.',

  {

    userId:
      z.number().int(),

    limit:
      z.number()
        .int()
        .min(1)
        .max(20)
        .default(5)

  },

  async ({
    userId,
    limit
  }) => {

    try {

      const expenses =
        await getTopExpenses(
          userId,
          limit
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expenses,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'get_top_expenses:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              'Failed to retrieve top expenses.'
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// ADD EXPENSE
// =====================================================

server.tool(

  'add_expense',

  'Add a new expense for the authenticated user.',

  {

    userId:
      z.number().int(),

    amount:
      z.number().positive(),

    category:
      z.string().min(1),

    description:
      z.string().min(1),

    date:
      z.string().min(1),

    notes:
      z.string().optional(),

    paymentMethod:
      z.string().optional()

  },

  async ({
    userId,
    amount,
    category,
    description,
    date,
    notes,
    paymentMethod
  }) => {

    try {

      const expense =
        await addExpense(
          userId,
          amount,
          category,
          description,
          date,
          notes,
          paymentMethod
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expense,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'add_expense:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              `Failed to add expense: ${error.message}`
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// UPDATE EXPENSE
// =====================================================

server.tool(

  'update_expense',

  'Update an existing expense belonging to the authenticated user.',

  {

    userId:
      z.number().int(),

    expenseId:
      z.number().int().positive(),

    amount:
      z.number().positive(),

    category:
      z.string().min(1),

    description:
      z.string().min(1),

    date:
      z.string().min(1),

    notes:
      z.string().optional(),

    paymentMethod:
      z.string().optional()

  },

  async ({
    userId,
    expenseId,
    amount,
    category,
    description,
    date,
    notes,
    paymentMethod
  }) => {

    try {

      const expense =
        await updateExpense(
          userId,
          expenseId,
          amount,
          category,
          description,
          date,
          notes,
          paymentMethod
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                expense,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'update_expense:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              `Failed to update expense: ${error.message}`
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// DELETE EXPENSE
// =====================================================

server.tool(

  'delete_expense',

  'Delete an expense belonging to the authenticated user.',

  {

    userId:
      z.number().int(),

    expenseId:
      z.number().int().positive()

  },

  async ({
    userId,
    expenseId
  }) => {

    try {

      const result =
        await deleteExpense(
          userId,
          expenseId
        )


      return {

        content: [

          {
            type:
              'text',

            text:
              JSON.stringify(
                result,
                null,
                2
              )
          }

        ]

      }

    } catch (error) {

      console.error(
        'delete_expense:',
        error
      )

      return {

        content: [

          {
            type:
              'text',

            text:
              `Failed to delete expense: ${error.message}`
          }

        ],

        isError:
          true

      }

    }

  }

)


// =====================================================
// START MCP SERVER
// =====================================================

async function main() {

  const transport =
    new StdioServerTransport()

  await server.connect(
    transport
  )

}


main().catch(error => {

  console.error(
    'MCP server error:',
    error
  )

  process.exit(1)

})