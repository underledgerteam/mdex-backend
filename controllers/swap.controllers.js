const Service = require('../services/swap.service');

const methods = {
  async getBestRate(req, res) {
    try {
      let tokenIn = req.query.tokenIn;
      let tokenOut = req.query.tokenOut;
      let amount = req.query.amount;
      let chainId = req.query.chainId;

      let result = await Service.getBestRate(tokenIn, tokenOut, amount, chainId);
      res.success(result);
    } catch (error) {
      res.error(error);
    }
  },

  async swap(req, res) {
    try {
      let tokenIn = req.body.tokenIn;
      let tokenOut = req.body.tokenOut;
      let chainId = req.body.chainId;
      let isSplitSwap = req.body.isSplitSwap;
      let tradingAmount = req.body.tradingAmount;
      let tradingRouteIndex = req.body.tradingRouteIndex;

      let result = await Service.swap(tokenIn, tokenOut, chainId, 
        isSplitSwap, tradingAmount, tradingRouteIndex);
        
      res.success(result);
    } catch (error) {
      res.error(error);
    }
  }
}

module.exports = { ...methods }