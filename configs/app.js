require('dotenv').config()

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 9000,
  isProduction: process.env.NODE_ENV === 'production',
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'my-secret',
  apiKey: process.env.API_KEY || 'supersecret'
}