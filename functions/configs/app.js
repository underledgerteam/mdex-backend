require('dotenv').config()

const DEFAULT_ENDPOINT = 'http://localhost:8545';

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.NODE_PORT || 9000,
  isProduction: process.env.NODE_ENV === 'production',
  secret: process.env.NODE_ENV === 'production' ? process.env.SECRET : 'my-secret',
  apiKey: process.env.API_KEY || 'supersecret',
  infuraKey: process.env.INFURA_KEY || DEFAULT_ENDPOINT,
  alchemyKey: process.env.ALCHEMY_KEY || DEFAULT_ENDPOINT
}