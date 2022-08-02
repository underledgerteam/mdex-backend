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
  ROUTING_CONTRACTS,
  DECIMAL
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


app.get("/cross-rate", async (req, res) => {
  const tokenIn = req.query.tokenIn;
  const tokenOut = req.query.tokenOut;
  const amount = req.query.amount;
  const sourceChainId = req.query.sourceChainId;
  const destinationChainId = req.query.destinationChainId;

  let data = {};
  let isSourceSplitSwap = false;
  let splitAmountOuts = [];

  const decimals = 18;

  // Swap source token to stable token
  const sourceWallet = await signedWallet(sourceChainId);

  const routingConfig = ROUTING_CONTRACTS[sourceChainId];
  const tokenStable = routingConfig.StableToken;

  const serviceFee = getServiceFee(amount);

  const netAmount = new BigNumber(amount - serviceFee);

  const _netAmount = netAmount.toFixed();
  const totalSourceAmount = ethers.utils.parseUnits(_netAmount.toString(), decimals)

  const queryContract = new ethers.Contract(
    routingConfig.AddressBestRouteQuery, routingConfig.ABIBestRouteQuery, sourceWallet);
  
  const oneRoute = await queryContract.oneRoute(tokenIn, tokenStable, totalSourceAmount, ROUTES);
  const splitRoutes = await queryContract.splitTwoRoutes(tokenIn, tokenStable,
    totalSourceAmount, ROUTES, DISTRIBUTION_PERCENT);
    
  const [indexOneRoute, amountOutOneRoute] = _getOneRoute(oneRoute);
  const [indexSplitRoute, volumesSplitRoute, amountOutsplitRoute] = _getSplitRoutes(splitRoutes);

  if (parseFloat(amountOutOneRoute) < parseFloat(amountOutsplitRoute)) {
    isSourceSplitSwap = true;
    splitAmountOuts = calculateSplitAmountOut(volumesSplitRoute, netAmount);
  }

  data["fee"] = serviceFee;

  if (isSourceSplitSwap) {
    data["source"] = {
      "isSplitSwap": isSourceSplitSwap,
      "amount": splitAmountOuts,
      "chainId": sourceChainId,
      "route": indexSplitRoute
    }
    totalSourceAmountOut = splitAmountOuts.reduce((a, b) => a + b, 0);
  } else {
    data["source"] = {
      "isSplitSwap": isSourceSplitSwap,
      "amount": amountOutOneRoute / 10 ** DECIMAL,
      "chainId": sourceChainId,
      "route": indexOneRoute
    }
    totalSourceAmountOut = amountOutOneRoute;
  }

  // Swap stable token to destination token
  const destinationWallet = await signedWallet(destinationChainId);

  const desRoutingConfig = ROUTING_CONTRACTS[destinationChainId];
  const desTokenStable = desRoutingConfig.StableToken;

  const _totalSourceAmountOut = new BigNumber(totalSourceAmountOut);
  const destTotalAmount = _totalSourceAmountOut.toFixed();

  const destinationQueryContract = new ethers.Contract(
    desRoutingConfig.AddressBestRouteQuery, desRoutingConfig.ABIBestRouteQuery, destinationWallet);
  
  const desOneRoute = await destinationQueryContract.oneRoute(desTokenStable, tokenOut, destTotalAmount, ROUTES);

  const desSplitRoutes = await destinationQueryContract.splitTwoRoutes(desTokenStable, tokenOut,
    destTotalAmount, ROUTES, DISTRIBUTION_PERCENT);

  const [desIndexOneRoute, desAmountOutOneRoute] = _getOneRoute(desOneRoute);
  const [desIndexSplitRoute, desVolumesSplitRoute, desAmountOutsplitRoute] = _getSplitRoutes(desSplitRoutes);

  if (parseFloat(desAmountOutOneRoute) < parseFloat(desAmountOutsplitRoute)) {
    const desSplitAmountOuts = calculateSplitAmountOut(desVolumesSplitRoute, destTotalAmount);

    data["destination"] = {
      "isSplitSwap": true,
      "amount": desSplitAmountOuts,
      "chainId": destinationChainId,
      "route": desIndexSplitRoute
    }
    totalDesAmountOut = desSplitAmountOuts.reduce((a, b) => a + b, 0);

  } else {
    data["destination"] = {
      "isSplitSwap": false,
      "amount": desAmountOutOneRoute / 10 ** 18,
      "chainId": destinationChainId,
      "route": desIndexOneRoute
    }
  }

  res.send(data);
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})