const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
})


const toGeminiSchema = (schema = {}) => {
  const {
    $schema,
    additionalProperties,
    ...cleanSchema
  } = schema

  return cleanSchema
}


const convertTools = (tools = []) => ([
  {
    functionDeclarations: tools.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description || '',
      parameters: toGeminiSchema(tool.function.parameters)
    }))
  }
])


const convertMessages = (messages = []) => messages
  .filter((message) => message.role !== 'system')
  .map((message) => {
    if (message.role === 'assistant') {
      const parts = []

      if (message.content) {
        parts.push({ text: message.content })
      }

      for (const toolCall of message.tool_calls || []) {
        parts.push({
          functionCall: {
            name: toolCall.function.name,
            args: typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments
          }
        })
      }

      return {
        role: 'model',
        parts: parts.length ? parts : [{ text: '' }]
      }
    }

    if (message.role === 'tool') {
      let response = message.content

      try {
        response = JSON.parse(response)
      } catch {
        response = { result: response }
      }

      return {
        role: 'user',
        parts: [{
          functionResponse: {
            name: message.name,
            response
          }
        }]
      }
    }

    return {
      role: 'user',
      parts: [{ text: message.content || '' }]
    }
  })


const generate = async ({ messages, tools }) => {
  const { apiKey, model } = getGeminiConfig()

  if (!apiKey) {
    throw new Error('Gemini API key is not configured')
  }

  const systemMessage = messages.find((message) => message.role === 'system')
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      systemInstruction: systemMessage
        ? { parts: [{ text: systemMessage.content }] }
        : undefined,
      contents: convertMessages(messages),
      tools: convertTools(tools),
      toolConfig: {
        functionCallingConfig: {
          mode: 'AUTO'
        }
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Gemini request failed (${response.status})`)
  }

  const data = await response.json()
  const parts = data.candidates?.[0]?.content?.parts || []
  const text = parts
    .filter((part) => part.text)
    .map((part) => part.text)
    .join('\n')
  const toolCalls = parts
    .filter((part) => part.functionCall?.name)
    .map((part, index) => ({
      id: `gemini-call-${Date.now()}-${index}`,
      name: part.functionCall.name,
      arguments: part.functionCall.args || {}
    }))

  return {
    text,
    toolCalls,
    model
  }
}


module.exports = {
  generate
}
