const express = require("express");
const app = express();
const config = require('./configs/app')
const ethers = require("ethers");
const BigNumber = require('bignumber.js');

// Cron job
require("./services/cron-jobs");

// Express Configs
require('./configs/express')(app)

const {
  signedWallet,
  getServiceFee, 
  calculateSplitAmountOut,
  _getOneRoute,
  _getSplitRoutes
} = require("./services/swap.service");

const {
  DISTRIBUTION_PERCENT,
  ROUTES,
  ROUTING_CONTRACTS
} = require("./utils/constants");

let port = process.env.PORT || 9000;

app.get("/rate", async (req, res) => {
  const tokenIn = req.query.tokenIn;
  const tokenOut = req.query.tokenOut;
  const amount = req.query.amount;
  const chainId = req.query.chainId;

  let data = {};
  let isSplitSwap = false;
  let splitAmountOuts = [];

  const wallet = await signedWallet(chainId);

  const routingConfig = ROUTING_CONTRACTS[chainId];
  const serviceFee = getServiceFee(amount);

  const netAmount = new BigNumber(amount - serviceFee);

  const queryContract = new ethers.Contract(
    routingConfig.AddressBestRouteQuery, routingConfig.ABIBestRouteQuery, wallet);
  
  const oneRoute = await queryContract.oneRoute(tokenIn, tokenOut, netAmount.toFixed(), ROUTES);
  const splitRoutes = await queryContract.splitTwoRoutes(tokenIn, tokenOut,
    netAmount.toFixed(), ROUTES, DISTRIBUTION_PERCENT);

  const [indexOneRoute, amountOutOneRoute] = _getOneRoute(oneRoute);
  const [indexSplitRoute, volumesSplitRoute, amountOutsplitRoute] = _getSplitRoutes(splitRoutes);

  if (parseFloat(amountOutOneRoute) < parseFloat(amountOutsplitRoute)) {
    isSplitSwap = true;
    splitAmountOuts = calculateSplitAmountOut(volumesSplitRoute, netAmount);
  }

  data["fee"] = serviceFee;
  data["isSplitSwap"] = isSplitSwap;

  if (isSplitSwap) {
      data["route"] = indexSplitRoute;
      data["amount"] = splitAmountOuts;
  } else {
    data["route"] = indexOneRoute;
    data["amount"] = amountOutOneRoute;
  }

  res.send(data);
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})