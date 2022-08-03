const express = require("express");
const app = express();
const config = require('./configs/app')
const ethers = require("ethers");
const BigNumber = require('bignumber.js');
// EXPONENTIAL_AT Default value: [-7, 20]
BigNumber.config({ EXPONENTIAL_AT: [-999, 999] })
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
  const amountIn = req.query.amount;
  const sourceChainId = req.query.sourceChainId;
  const destinationChainId = req.query.destinationChainId;

  // console.log("amountIn: ", amountIn);

  // Convert amount to Uint
  // const amountIn = ethers.utils.parseUnits(amount.toString(), DECIMALS);

  // SOURCE: Query pair of tokenIn - stableToken ============================================
  const sourceConfig = ROUTING_CONTRACTS[sourceChainId];
  
  const sourceWallet = await signedWallet(sourceChainId);
  const sourceQueryContract = new ethers.Contract(
    sourceConfig.AddressBestRouteQuery, sourceConfig.ABIBestRouteQuery, sourceWallet);
    
  const serviceFee = getServiceFee(amountIn);
  const _serviceFee = serviceFee / 10 ** 18;
  const _amountIn = amountIn / 10 ** 18;

  console.log("_amountIn: ", _amountIn);
  console.log("_serviceFee: ", _serviceFee);

  const netAmountIn = parseFloat(_amountIn) - parseFloat(_serviceFee);
  console.log("netAmountIn: ", netAmountIn);

  const x = new BigNumber((netAmountIn * 10 ** 18)).toString()
  console.log("x tpyr", typeof(x));
  console.log("x ", x);

  // const y = ethers.utils.parseEther(x)

  // Source one route
  const sourceOneRoute = await sourceQueryContract.oneRoute(
    tokenIn, sourceConfig.StableToken, x, ROUTES);
  console.log("sourceOneRoute: ", sourceOneRoute);

  const [sourceOneRouteData, sourceOneRouteAmountOut, sourceOneRouteNetAmountOut]
    = transferSourceOneRoute(sourceOneRoute.routeIndex, sourceOneRoute.amountOut);

  // Source split route
  const sourceSplitRoute = await sourceQueryContract.splitTwoRoutes(
    tokenIn, sourceConfig.StableToken, x, ROUTES, DISTRIBUTION_PERCENT);

  const [sourceSplitRouteData, sourceSplitRouteAmount, sourceSplitRouteNetAmountOut]
    = transferSourceSplitRoute(
      sourceSplitRoute.routeIndexs, sourceSplitRoute.volumns, sourceSplitRoute.amountOut);

  // Prepare return data
  let totalAmountOut;
  let data = { "fee": _serviceFee * 10 ** 18 };

  if (parseFloat(sourceOneRouteNetAmountOut) < parseFloat(sourceSplitRouteNetAmountOut) &&
    sourceSplitRouteData.length >= 2) {

    totalAmountOut = sourceSplitRouteNetAmountOut;

    let displayAmountOuts = [];
    for (let i = 0; i < sourceSplitRouteAmount.length; i++) {
      const amountOut = new BigNumber(sourceSplitRouteAmount[i]);
      displayAmountOuts.push(amountOut.toFixed());
    }

    data["source"] = {
      "amount": displayAmountOuts,
      "chainId": sourceChainId,
      "isSplitSwap": true,
      "route": sourceSplitRouteData
    }
  } else {
    totalAmountOut = sourceOneRouteNetAmountOut;

    data["source"] = {
      "amount": sourceOneRouteAmountOut,
      "chainId": sourceChainId,
      "isSplitSwap": false,
      "route": sourceOneRouteData
    }
  }

  // console.log(data);

  // DESTINATION: Query pair of stableToken - tokenOut ============================================
  // !! HOT FIX: Round up number to prevent invalid Bignumber string
  const _totalAmountOut = Math.round(totalAmountOut);

  const desAmountIn = new BigNumber(_totalAmountOut);
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
      displayAmountOuts.push(amountOut.toFixed());
    }

    data["destination"] = {
      "amount": displayAmountOuts,
      "chainId": destinationChainId,
      "isSplitSwap": true,
      "route": desSplitRouteData
    }
  } else {
    data["destination"] = {
      "amount": desOneRouteAmountOut,
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