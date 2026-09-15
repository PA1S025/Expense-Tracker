const express = require('express')

const authenticateToken =
  require('../middleware/authMiddleware')

const {
  createMcpClient
} = require('../services/mcpClient')

const {
  generateAIResponse
} = require('../services/aiService')


const router = express.Router()


const getPublicErrorMessage = (error) => {
  const message = String(error?.message || '')

  if (message.includes('API key') || message.includes('provider')) {
    return message
  }

  if (message.includes('Ollama') || message.includes('Gemini')) {
    return message
  }

  if (message.includes('MCP') || message.includes('tool')) {
    return message
  }

  if (message.includes('quota') || message.includes('rate limit') || message.includes('free_tier')) {
    return 'Gemini API quota exceeded. Please wait for the quota to reset or check your Google AI Studio billing and limits.'
  }

  return 'AI request failed. Please try again.'
}


router.post(
  '/chat',
  authenticateToken,
  async (req, res) => {
    let mcp = null

    try {
      const {
        message,
        context = {}
      } = req.body || {}

      if (!message || !String(message).trim()) {
        return res.status(400).json({
          message: 'Message is required'
        })
      }

      if (typeof context !== 'object' || Array.isArray(context)) {
        return res.status(400).json({
          message: 'Context must be an object'
        })
      }

      mcp = await createMcpClient()
      const mcpTools = await mcp.client.listTools()
      const result = await generateAIResponse({
        message,
        context,
        userId: req.user.id,
        mcpClient: mcp.client,
        mcpTools
      })

      return res.json({
        message: 'AI response generated',
        reply: result.reply,
        model: result.model,
        provider: result.provider,
        toolUsed: result.toolUsed,
        user: {
          id: req.user.id,
          email: req.user.email
        }
      })
    } catch (error) {
      console.error('AI chat error:', error.message)

      return res.status(502).json({
        message: getPublicErrorMessage(error)
      })
    } finally {
      if (mcp) {
        try {
          await mcp.transport.close()
        } catch (error) {
          console.error('MCP close error:', error.message)
        }
      }
    }
  }
)


module.exports = router
