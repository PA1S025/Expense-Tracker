import {
  useState
} from 'react'

import {
  sendAIMessage
} from '../api'


function AIChat({
  selectedMonth,
  selectedYear,
  budget,
  totalSpent,
  remaining,
  topCategory,
  expenseCount,
  expenseSummary,
  expenses
}) {

  const [
    input,
    setInput
  ] = useState('')


  const [
    messages,
    setMessages
  ] = useState([])


  const [
    loading,
    setLoading
  ] = useState(false)


  const handleSubmit =
    async (event) => {

      event.preventDefault()


      const question =
        input.trim()


      if (
        !question ||
        loading
      ) {

        return

      }


      setMessages(
        previous => [

          ...previous,

          {
            role:
              'user',

            content:
              question
          }

        ]
      )


      setInput('')

      setLoading(true)


      try {

        const data =
          await sendAIMessage(
            question,
            {
              selectedMonth,
              selectedYear,
              budget,
              totalSpent,
              remaining,
              topCategory,
              expenseCount,
              expenseSummary,
              expenses: expenses?.slice(0, 25) || []
            }
          )


        setMessages(
          previous => [

            ...previous,

            {

              role:
                'assistant',

              content:
                data.reply ||

                'No response received.'

            }

          ]
        )


      } catch (error) {

        setMessages(
          previous => [

            ...previous,

            {

              role:
                'assistant',

              content:
                `Error: ${error.message}`

            }

          ]
        )

      } finally {

        setLoading(false)

      }

    }


  return (

    <section className="ai-chat">

      <div className="ai-chat-header">

        <h2>
          AI Expense Assistant
        </h2>

        <p>
          Ask questions about your spending.
        </p>

      </div>


      <div className="ai-chat-messages">

        {messages.map(
          (
            message,
            index
          ) => (

            <div
              key={index}
              className={
                `ai-message ${message.role}`
              }
            >

              <strong>

                {message.role ===
                'user'
                  ? 'You'
                  : 'AI'}

              </strong>


              <p>
                {message.content}
              </p>

            </div>

          )
        )}


        {loading && (

          <div className="ai-message assistant">

            <strong>
              AI
            </strong>

            <p>
              Thinking...
            </p>

          </div>

        )}

      </div>


      <form
        className="ai-chat-form"
        onSubmit={
          handleSubmit
        }
      >

        <input

          type="text"

          value={
            input
          }

          onChange={
            event =>
              setInput(
                event.target.value
              )
          }

          placeholder={
            'Ask about your expenses...'
          }

          disabled={
            loading
          }

        />


        <button

          type="submit"

          disabled={
            loading ||
            !input.trim()
          }

        >

          {loading
            ? '...'
            : 'Ask'}

        </button>

      </form>

    </section>

  )

}


export default AIChat