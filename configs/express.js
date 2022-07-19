const express = require('express'),
  morgan = require('morgan'),
  cors = require('cors')
;(path = require('path'))

module.exports = async (app) => {
  // CORS
  const allowedOrigins = ["http://localhost:3000", "https://mdex.pages.dev"]
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.'
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
  }
  app.use(cors(corsOptions))

  // Parser Body
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  // Logger
  app.use(morgan('dev'))

  // Static file
  app.use('/static', express.static(path.join(__dirname, '../public')))

  // Custom Response Format
  app.use(require('../configs/responseFormat'))
}