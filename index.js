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
  _getSplitRoutes,
  transferSourceOneRoute,
  transferSourceSplitRoute
} = require("./services/swap.service");

const {
  DISTRIBUTION_PERCENT,
  ROUTES,
  ROUTING_CONTRACTS,
  DECIMALS
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
  // Define request query
  const tokenIn = req.query.tokenIn;
  const tokenOut = req.query.tokenOut;
  const amount = req.query.amount;
  const sourceChainId = req.query.sourceChainId;
  const destinationChainId = req.query.destinationChainId;

  // Convert amount to Uint
  const amountIn = ethers.utils.parseUnits(amount.toString(), DECIMALS);

  // SOURCE: Query pair of tokenIn - stableToken ============================================
  const sourceConfig = ROUTING_CONTRACTS[sourceChainId];
  const serviceFee = getServiceFee(amountIn);

  const sourceWallet = await signedWallet(sourceChainId);
  const sourceQueryContract = new ethers.Contract(
    sourceConfig.AddressBestRouteQuery, sourceConfig.ABIBestRouteQuery, sourceWallet);

  const netAmountIn = amountIn - serviceFee;
  const bignumberNetAmountIn = new BigNumber(netAmountIn);

  // Source one route
  const sourceOneRoute = await sourceQueryContract.oneRoute(
    tokenIn, sourceConfig.StableToken, bignumberNetAmountIn.toFixed(), ROUTES);

  const [sourceOneRouteData, sourceOneRouteAmountOut]
    = transferSourceOneRoute(sourceOneRoute.routeIndex, sourceOneRoute.amountOut);

  // Source split route
  const sourceSplitRoute = await sourceQueryContract.splitTwoRoutes(
    tokenIn, sourceConfig.StableToken, bignumberNetAmountIn.toFixed(), ROUTES, DISTRIBUTION_PERCENT);

  const [sourceSplitRouteData, sourceSplitRouteAmount, sourceSplitRouteNetAmountOut]
    = transferSourceSplitRoute(
      sourceSplitRoute.routeIndexs, sourceSplitRoute.volumns, sourceSplitRoute.amountOut);

  // Prepare return data
  let totalAmountOut;
  let data = { "fee": serviceFee / 10 ** DECIMALS};

  if (parseFloat(sourceOneRouteAmountOut) < parseFloat(sourceSplitRouteNetAmountOut)) {
    totalAmountOut = sourceSplitRouteNetAmountOut;

    let displayAmountOuts = [];
    for (let i = 0; i < sourceSplitRouteAmount.length; i++) {
      const amountOut = new BigNumber(sourceSplitRouteAmount[i]);
      displayAmountOuts.push(amountOut.toFixed() / 10 ** DECIMALS);
    }

    data["source"] = {
      "amount": displayAmountOuts,
      "chainId": sourceChainId,
      "isSplitSwap": true,
      "route": sourceSplitRouteData
    }
  } else {
    totalAmountOut = sourceOneRouteAmountOut;

    data["source"] = {
      "amount": sourceOneRouteAmountOut / 10 ** DECIMALS,
      "chainId": sourceChainId,
      "isSplitSwap": false,
      "route": sourceOneRouteData
    }
  }

  // DESTINATION: Query pair of stableToken - tokenOut ============================================
  const desAmountIn = new BigNumber(totalAmountOut);
  const desConfig = ROUTING_CONTRACTS[destinationChainId];

  const desWallet = await signedWallet(destinationChainId);
  const desQueryContract = new ethers.Contract(
    desConfig.AddressBestRouteQuery, desConfig.ABIBestRouteQuery, desWallet);

  // Destination one route
  const desOneRoute = await desQueryContract.oneRoute(
    desConfig.StableToken, tokenOut, desAmountIn.toFixed(), ROUTES);

  const [desOneRouteData, desOneRouteAmountOut]
    = transferSourceOneRoute(desOneRoute.routeIndex, desOneRoute.amountOut);

  // Destination split route
  const desSplitRoute = await desQueryContract.splitTwoRoutes(
    desConfig.StableToken, tokenOut, desAmountIn.toFixed(), ROUTES, DISTRIBUTION_PERCENT);

  const [desSplitRouteData, desSplitRouteAmount, desSplitRouteNetAmountOut]
    = transferSourceSplitRoute(
      desSplitRoute.routeIndexs, desSplitRoute.volumns, desSplitRoute.amountOut);

  if (parseFloat(desOneRouteAmountOut) < parseFloat(desSplitRouteNetAmountOut)) {
    let displayAmountOuts = [];
    for (let i = 0; i < desSplitRouteAmount.length; i++) {
      const amountOut = new BigNumber(desSplitRouteAmount[i]);
      displayAmountOuts.push(amountOut.toFixed() / 10 ** DECIMALS);
    }

    data["destination"] = {
      "amount": displayAmountOuts,
      "chainId": destinationChainId,
      "isSplitSwap": true,
      "route": desSplitRouteData
    }
  } else {
    data["destination"] = {
      "amount": desOneRouteAmountOut / 10 ** DECIMALS,
      "chainId": destinationChainId,
      "isSplitSwap": false,
      "route": desOneRouteData
    }
  }

  res.send(data);
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})