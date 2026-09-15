const getOllamaConfig = () => ({
  url: process.env.OLLAMA_URL,
  model: process.env.OLLAMA_MODEL || 'qwen2.5:3b'
})


const generate = async ({ messages, tools }) => {
  const { url, model } = getOllamaConfig()

  if (!url) {
    throw new Error('Ollama URL is not configured')
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      stream: false
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama request failed (${response.status})`)
  }

  const data = await response.json()
  const message = data.message || {}
  const toolCalls = Array.isArray(message.tool_calls)
    ? message.tool_calls.map((toolCall, index) => ({
      id: toolCall.id || `ollama-call-${Date.now()}-${index}`,
      name: toolCall.function?.name,
      arguments: toolCall.function?.arguments || {}
    }))
    : []

  return {
    text: message.content || '',
    toolCalls,
    model: data.model || model
  }
}


module.exports = {
  generate
}
