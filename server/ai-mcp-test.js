const {
  Client
} = require('@modelcontextprotocol/sdk/client/index.js')

const {
  StdioClientTransport
} = require('@modelcontextprotocol/sdk/client/stdio.js')


async function main() {

  // Create MCP client
  const client =
    new Client({
      name: 'expense-ai-client',
      version: '1.0.0'
    })


  // Start our MCP server
  const transport =
    new StdioClientTransport({

      command: 'node',

      args: [
        'server.js'
      ],

      cwd: __dirname + '/mcp'

    })


  // Connect to MCP server
  await client.connect(
    transport
  )


  // Get available MCP tools
  const tools =
    await client.listTools()


  console.log(
    '\nMCP tools available to AI:\n'
  )

  console.log(
    JSON.stringify(
      tools,
      null,
      2
    )
  )


  // Call the tool
  const result =
    await client.callTool({

      name:
        'get_current_month_expenses',

      arguments: {
        userId: 2
      }

    })


  console.log(
    '\nMCP tool result:\n'
  )

  console.log(
    JSON.stringify(
      result,
      null,
      2
    )
  )


  await transport.close()

}


main().catch(error => {

  console.error(
    'MCP AI client error:',
    error
  )

  process.exit(1)

})