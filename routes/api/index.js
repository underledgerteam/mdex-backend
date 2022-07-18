const router = require('express').Router()
const controllers = require('../../controllers/swap.controllers')

router.get('/rate', controllers.getBestRate);
router.post('/swap', controllers.swap);

module.exports = router