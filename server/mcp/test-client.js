require('dotenv').config({
  path: '../.env'
})

const {
  Client
} = require('@modelcontextprotocol/sdk/client/index.js')

const {
  StdioClientTransport
} = require('@modelcontextprotocol/sdk/client/stdio.js')


async function main() {

  const client =
    new Client({
      name: 'expense-test-client',
      version: '1.0.0'
    })


  const transport =
  new StdioClientTransport({

    command: 'node',

    args: [
      'server.js'
    ],

    cwd: process.cwd()

  })


  /*
    Connect to our MCP server
  */

  await client.connect(
    transport
  )


  /*
    Ask MCP:
    "What tools do you have?"
  */

  const tools =
    await client.listTools()


  console.log(
    '\nAvailable MCP tools:\n'
  )

  console.log(
    JSON.stringify(
      tools,
      null,
      2
    )
  )


  /*
    Call our expense tool
  */

  const result =
    await client.callTool({

      name:
        'get_current_month_expenses',

      arguments: {
        userId: 2
      }

    })


  console.log(
    '\nExpense tool result:\n'
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
    'MCP client error:',
    error
  )

  process.exit(1)

})