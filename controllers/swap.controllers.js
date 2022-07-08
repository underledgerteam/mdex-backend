const Service = require('../services/swap.service');

const methods = {
    // http://localhost:5000/api/v1/swap/getpair?token0=&token1=
    async getPair(req, res) {
        try {
            let result = await Service.getPair(
                req.params.token0,
                req.params.token1
            )
            res.success(result)
        } catch (error) {
            res.error(error)
        }
    },

    async getText(req, res) {
        try {
            res.success("Test Endpoint")
        } catch (error) {
            res.error(error)
        }
    }
}

module.exports = { ...methods }