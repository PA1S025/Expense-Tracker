const response = await fetch(
  'http://localhost:11434/api/chat',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'qwen2.5:3b',

      messages: [
        {
          role: 'system',
          content:
            'You are an expense tracker assistant. The authenticated user ID is 2. When the user asks about expenses, use the available expense tool.'
        },
        {
          role: 'user',
          content:
            'How much did I spend this month?'
        }
      ],

      tools: [
        {
          type: 'function',

          function: {
            name:
              'get_current_month_expenses',

            description:
              'Get the current month expenses for a user.',

            parameters: {
              type: 'object',

              properties: {
                userId: {
                  type: 'integer',

                  description:
                    'The authenticated user ID'
                }
              },

              required: [
                'userId'
              ]
            }
          }
        }
      ],

      stream: false
    })
  }
)

const data =
  await response.json()

console.log(
  JSON.stringify(
    data,
    null,
    2
  )
)