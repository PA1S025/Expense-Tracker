const getGeminiConfig = () => ({
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-2.0-flash'
})


const toGeminiSchema = (schema = {}) => {
  if (Array.isArray(schema)) {
    return schema.map(toGeminiSchema)
  }

  if (!schema || typeof schema !== 'object') {
    return schema
  }

  const unsupportedKeys = new Set([
    '$schema',
    'additionalProperties',
    'exclusiveMaximum',
    'exclusiveMinimum'
  ])

  return Object.entries(schema).reduce((cleanSchema, [key, value]) => {
    if (!unsupportedKeys.has(key)) {
      cleanSchema[key] = toGeminiSchema(value)
    }

    return cleanSchema
  }, {})
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
        const functionCallPart = {
          functionCall: {
            name: toolCall.function.name,
            args: typeof toolCall.function.arguments === 'string'
              ? JSON.parse(toolCall.function.arguments)
              : toolCall.function.arguments
          }
        }

        if (toolCall.thoughtSignature) {
          functionCallPart.thoughtSignature = toolCall.thoughtSignature
        }

        parts.push(functionCallPart)
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

      if (!response || typeof response !== 'object' || Array.isArray(response)) {
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
  const geminiTools = convertTools(tools)
  const requestBody = {
    systemInstruction: systemMessage
      ? { parts: [{ text: systemMessage.content }] }
      : undefined,
    contents: convertMessages(messages)
  }

  if (geminiTools[0]?.functionDeclarations?.length) {
    requestBody.tools = geminiTools
    requestBody.toolConfig = {
      functionCallingConfig: {
        mode: 'AUTO'
      }
    }
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorBody = await response.text()
    let errorMessage = `Gemini request failed (${response.status})`

    try {
      const parsedError = JSON.parse(errorBody)
      errorMessage = parsedError.error?.message || errorMessage
    } catch {
      // Keep the status when the provider does not return JSON.
    }

    throw new Error(errorMessage)
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
      arguments: part.functionCall.args || {},
      thoughtSignature: part.thoughtSignature
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
