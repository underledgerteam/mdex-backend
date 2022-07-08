const router = require('express').Router()

router.use('/swap', require('./swap'))

module.exports = router