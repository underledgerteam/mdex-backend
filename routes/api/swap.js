const router = require('express').Router()
const controllers = require('../../controllers/swap.controllers')

router.get('/', controllers.getText)
router.get('/qoute', controllers.qoute)

module.exports = router