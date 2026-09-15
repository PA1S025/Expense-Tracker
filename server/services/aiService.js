const ollamaProvider = require('./providers/ollamaProvider')
const geminiProvider = require('./providers/geminiProvider')


const MAX_TOOL_ITERATIONS = 6


const getProvider = () => {
  const providerName = String(process.env.AI_PROVIDER || 'ollama').trim().toLowerCase()

  if (providerName === 'ollama') {
    return {
      name: providerName,
      provider: ollamaProvider
    }
  }

  if (providerName === 'gemini') {
    return {
      name: providerName,
      provider: geminiProvider
    }
  }

  throw new Error(`Unsupported AI provider: ${providerName}`)
}


const convertMcpTools = (mcpTools) => (mcpTools.tools || []).map((tool) => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description || '',
    parameters: tool.inputSchema || {
      type: 'object',
      properties: {}
    }
  }
}))


const parseToolArguments = (value) => {
  if (!value) {
    return {}
  }

  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    throw new Error('The AI returned invalid MCP tool arguments')
  }
}


const getToolContent = (toolResult) => {
  if (!toolResult?.content) {
    return ''
  }

  return toolResult.content
    .map((item) => item.text || '')
    .join('\n')
}


const buildSystemPrompt = ({ userId, context }) => `You are the AI assistant for an expense tracker.

The authenticated user ID is ${userId}. Never ask the user for an ID and never use an ID from the user or model over the authenticated ID supplied by the server.

Use only MCP results and the current app context. Use Indian Rupees (₹) for amounts.
If the user asks about expenses, totals, categories, dates, or top expenses, use the matching MCP tool.
If the user asks to add, update, or delete an expense, use the matching MCP tool.
If the app context already contains the selected month and budget summary, answer directly from it and do not ask the user to select a month or set a budget.
After MCP results are returned, answer the original question naturally.

CURRENT APP CONTEXT:
${JSON.stringify(context || {}, null, 2)}`


const buildContextReply = (message, context = {}) => {
  const promptText = String(message).trim().toLowerCase()
  const expenses = Array.isArray(context.expenses) ? context.expenses : []
  const categoryMatch = promptText.match(/(?:on|in|for|category)\s+(?:the\s+)?([a-z][a-z\s-]*)/i)
  const requestedCategory = categoryMatch
    ? categoryMatch[1].trim().replace(/[?.!,]+$/, '')
    : ''
  const categoryExpenses = requestedCategory
    ? expenses.filter((expense) => String(expense.category || '').toLowerCase() === requestedCategory.toLowerCase())
    : []

  if (expenses.length > 0 && requestedCategory && /expense|spent|spending|how much|total|category/.test(promptText)) {
    const total = categoryExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
    const period = context.selectedMonth || (context.selectedYear ? `the year ${context.selectedYear}` : 'this selection')
    const label = requestedCategory.charAt(0).toUpperCase() + requestedCategory.slice(1)
    const lines = categoryExpenses.slice(0, 10).map((expense) => (
      `${expense.description || 'Expense'}: ₹${Number(expense.amount || 0).toFixed(2)}`
    ))

    return categoryExpenses.length > 0
      ? `${label} spending for ${period} is ₹${total.toFixed(2)} across ${categoryExpenses.length} expense${categoryExpenses.length === 1 ? '' : 's'}. ${lines.join('; ')}.`
      : `There are no ${requestedCategory} expenses in ${period}.`
  }

  const asksBudget = /budget|spend|remaining|within budget|how much|safe spend|over budget/.test(promptText)
  const budget = Number(context.budget ?? context.expenseSummary?.budget ?? 0)
  const spent = Number(context.totalSpent ?? context.expenseSummary?.totalSpent ?? 0)
  const remaining = Number(context.remaining ?? context.expenseSummary?.remaining ?? budget - spent)
  const hasBudgetContext = Boolean(context.selectedMonth || context.selectedYear || context.expenseSummary || context.budget !== undefined)

  if (asksBudget && hasBudgetContext) {
    const period = context.selectedMonth || (context.selectedYear ? `Year ${context.selectedYear}` : 'this period')
    const category = context.topCategory || context.expenseSummary?.topCategory || 'N/A'
    const count = Number(context.expenseCount ?? context.expenseSummary?.count ?? 0)

    if (budget > 0 && remaining >= 0) {
      return `For ${period}, you have spent ₹${spent.toFixed(2)} out of a budget of ₹${budget.toFixed(2)}. You still have ₹${remaining.toFixed(2)} left, so you can spend up to ₹${remaining.toFixed(2)} more without going over budget. Your top category is ${category}, with ${count} recorded expense${count === 1 ? '' : 's'} in this selection.`
    }

    if (budget > 0) {
      return `For ${period}, you have spent ₹${spent.toFixed(2)} against a budget of ₹${budget.toFixed(2)}. You are over budget by ₹${Math.abs(remaining).toFixed(2)}.`
    }

    return `For ${period}, you have spent ₹${spent.toFixed(2)}. No budget is set for this period, so there is no spending cap to compare against.`
  }

  return null
}


const generateAIResponse = async ({
  message,
  context = {},
  userId,
  mcpClient,
  mcpTools
}) => {
  const { name: providerName, provider } = getProvider()
  console.log(`AI provider selected: ${providerName}`)

  const contextReply = buildContextReply(message, context)
  if (contextReply) {
    return {
      reply: contextReply,
      model: 'app-context',
      toolUsed: ['app-context-rag'],
      provider: providerName
    }
  }

  const tools = convertMcpTools(mcpTools)
  const availableTools = new Set(tools.map((tool) => tool.function.name))
  const messages = [
    {
      role: 'system',
      content: buildSystemPrompt({ userId, context })
    },
    {
      role: 'user',
      content: `${String(message).trim()}\n\nAPP_CONTEXT:\n${JSON.stringify(context, null, 2)}`
    }
  ]
  const toolUsed = []
  let lastModel = providerName

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const result = await provider.generate({ messages, tools })
    lastModel = result.model || lastModel

    if (!result.toolCalls || result.toolCalls.length === 0) {
      const reply = String(result.text || '').trim()
      if (!reply) {
        throw new Error('The AI provider returned an empty response')
      }

      return {
        reply,
        model: lastModel,
        toolUsed,
        provider: providerName
      }
    }

    const assistantToolCalls = result.toolCalls.map((toolCall) => ({
      id: toolCall.id,
      thoughtSignature: toolCall.thoughtSignature,
      function: {
        name: toolCall.name,
        arguments: toolCall.arguments
      }
    }))

    messages.push({
      role: 'assistant',
      content: result.text || '',
      tool_calls: assistantToolCalls
    })

    for (const toolCall of result.toolCalls) {
      if (!availableTools.has(toolCall.name)) {
        throw new Error(`The AI requested an unavailable MCP tool: ${toolCall.name}`)
      }

      const argumentsFromModel = parseToolArguments(toolCall.arguments)
      const toolArguments = {
        ...argumentsFromModel,
        userId
      }

      console.log(`MCP tool requested: ${toolCall.name}`)
      const toolResult = await mcpClient.callTool({
        name: toolCall.name,
        arguments: toolArguments
      })
      toolUsed.push(toolCall.name)
      console.log(`MCP tool completed successfully: ${toolCall.name}`)

      messages.push({
        role: 'tool',
        name: toolCall.name,
        content: getToolContent(toolResult),
        tool_call_id: toolCall.id
      })
    }
  }

  throw new Error(`AI tool-calling exceeded the ${MAX_TOOL_ITERATIONS}-step limit`)
}


module.exports = {
  generateAIResponse,
  convertMcpTools,
  getProvider
}
