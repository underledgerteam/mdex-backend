const { getPriceImpact, getRoute } = require('../services/swap.service');
const Service = require('../services/swap.service');

const methods = {
    async qoute(req, res) {
        let tokenIn = req.query.tokenIn;
        let tokenOut = req.query.tokenOut;
        let amount = req.query.amount;
        let chainId = req.query.chainId;

        try {
            let result = await Service.qoute(
                tokenIn,
                tokenOut,
                amount,
                chainId
            );
            
            res.success(result);
        } catch (error) {
            res.error(error);
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