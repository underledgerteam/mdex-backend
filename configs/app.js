require('dotenv').config()

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.NODE_PORT || 9000,
  isProduction: process.env.NODE_ENV === 'production',
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'my-secret',
  apiKey: process.env.API_KEY || 'supersecret',
  apiVersion: process.env.API_VERSION || 1
}