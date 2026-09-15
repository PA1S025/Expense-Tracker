const { Pool } = require('pg')
const path = require('path')

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true
})

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432
      }
)

pool.on('connect', () => {
  console.log('Connected to PostgreSQL')
})

pool.on('error', (error) => {
  console.error('PostgreSQL error:', error)
})

module.exports = pool