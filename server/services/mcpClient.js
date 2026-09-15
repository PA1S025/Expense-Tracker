const {
  Client
} = require(
  '@modelcontextprotocol/sdk/client/index.js'
)

const {
  StdioClientTransport
} = require(
  '@modelcontextprotocol/sdk/client/stdio.js'
)


const createMcpClient = async () => {
  const client = new Client({
    name: 'expense-ai-client',
    version: '1.0.0'
  })

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['server.js'],
    cwd: `${__dirname}/../mcp`
  })

  await client.connect(transport)

  return {
    client,
    transport
  }
}


module.exports = {
  createMcpClient
}
