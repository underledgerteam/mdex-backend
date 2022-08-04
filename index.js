const express = require("express");
const app = express();
const config = require('./configs/app')
const ethers = require("ethers");
const BigNumber = require('bignumber.js');
const Decimal = require('decimal.js');

// EXPONENTIAL_AT Default value: [-7, 20]
// BigNumber.config({ EXPONENTIAL_AT: [-999, 999] })
// Cron job
require("./services/cron-jobs");

// Express Configs
require('./configs/express')(app)

const {
  signedWallet,
  calculateSplitAmountOut,
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
  const amountIn = req.query.amount;
  const chainId = req.query.chainId;

  const config = ROUTING_CONTRACTS[chainId];

  const wallet = await signedWallet(chainId);
  const queryContract = new ethers.Contract(
    config.AddressBestRouteQuery, config.ABIBestRouteQuery, wallet);

  const ethAmountIn = ethers.utils.formatEther(amountIn, 18);
  const serviceFee = Decimal(ethAmountIn).mul(0.01);
  const amountInWithFee = Decimal(ethAmountIn).sub(serviceFee);

  const weiServiceFee = ethers.utils.parseUnits(Decimal(serviceFee).toFixed(18), 18);
  const weiAmountIn = ethers.utils.parseUnits(Decimal(amountInWithFee).toFixed(18), 18);

  // One route
  const oneRoute = await queryContract.oneRoute(tokenIn, tokenOut, weiAmountIn, ROUTES);

  const [oneRouteData, oneRouteAmountOut, oneRouteNetAmountOut] 
    = transferSourceOneRoute(oneRoute.routeIndex, oneRoute.amountOut);

  // Split Route
  const splitRoute = await queryContract.splitTwoRoutes(
    tokenIn, tokenOut, weiAmountIn, ROUTES, DISTRIBUTION_PERCENT);

  const [splitRouteData, splitRouteAmount, splitRouteNetAmountOut]
    = transferSourceSplitRoute(
      splitRoute.routeIndexs, splitRoute.volumns, splitRoute.amountOut);

  // Prepare return data
  let data = {};

  // Define service fee
  data["fee"] = weiServiceFee.toString();
      
  if (parseFloat(oneRouteNetAmountOut) < parseFloat(splitRouteNetAmountOut) &&
    splitRouteData.length >= 2) {

    data["amount"] = splitRouteAmount
    data["isSplitSwap"] = true
    data["route"] = splitRouteData
  } else {
    data["amount"] = oneRouteAmountOut
    data["isSplitSwap"] = false
    data["route"] = oneRouteData
  }

  res.send(data)
});


app.get("/cross-rate", async (req, res) => {
  // Define request query
  const tokenIn = req.query.tokenIn;
  const tokenOut = req.query.tokenOut;
  const amountIn = req.query.amount;
  const sourceChainId = req.query.sourceChainId;
  const destinationChainId = req.query.destinationChainId;

  // SOURCE: Query pair of tokenIn - stableToken ============================================
  const sourceConfig = ROUTING_CONTRACTS[sourceChainId];
  
  const sourceWallet = await signedWallet(sourceChainId);
  const sourceQueryContract = new ethers.Contract(
    sourceConfig.AddressBestRouteQuery, sourceConfig.ABIBestRouteQuery, sourceWallet);

  const ethAmountIn = ethers.utils.formatEther(amountIn, 18);
  const serviceFee = Decimal(ethAmountIn).mul(0.01);
  const amountInWithFee = Decimal(ethAmountIn).sub(serviceFee);

  const weiServiceFee = ethers.utils.parseUnits(Decimal(serviceFee).toFixed(18), 18);
  const weiAmountIn = ethers.utils.parseUnits(Decimal(amountInWithFee).toFixed(18), 18);

  // Source one route
  const sourceOneRoute = await sourceQueryContract.oneRoute(
    tokenIn, sourceConfig.StableToken, weiAmountIn, ROUTES);

  const [sourceOneRouteData, sourceOneRouteAmountOut, sourceOneRouteNetAmountOut]
    = transferSourceOneRoute(sourceOneRoute.routeIndex, sourceOneRoute.amountOut);

  // Source split route
  const sourceSplitRoute = await sourceQueryContract.splitTwoRoutes(
    tokenIn, sourceConfig.StableToken, weiAmountIn, ROUTES, DISTRIBUTION_PERCENT);

  const [sourceSplitRouteData, sourceSplitRouteAmount, sourceSplitRouteNetAmountOut]
    = transferSourceSplitRoute(
      sourceSplitRoute.routeIndexs, sourceSplitRoute.volumns, sourceSplitRoute.amountOut);

  // Prepare return data
  let totalAmountOut = 0;
  let data = {};

  // Define service fee
  data["fee"] = weiServiceFee.toString();
      
  if (parseFloat(sourceOneRouteNetAmountOut) < parseFloat(sourceSplitRouteNetAmountOut) &&
    sourceSplitRouteData.length >= 2) {
    
    totalAmountOut = sourceSplitRouteNetAmountOut;

    data["source"] = {
      "amount": sourceSplitRouteAmount,
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

  console.log("totalAmountOut: ", totalAmountOut);

  // DESTINATION: Query pair of stableToken - tokenOut ============================================
  // !! HOT FIX: Round up number to prevent invalid Bignumber string
  const _totalAmountOut = Math.round(totalAmountOut);

  const desConfig = ROUTING_CONTRACTS[destinationChainId];
  
  const desWallet = await signedWallet(destinationChainId);
  const desQueryContract = new ethers.Contract(
    desConfig.AddressBestRouteQuery, desConfig.ABIBestRouteQuery, desWallet);
      
  // Destination one route
  const desOneRoute = await desQueryContract.oneRoute(
    desConfig.StableToken, tokenOut, _totalAmountOut, ROUTES);

  const [desOneRouteData, desOneRouteAmountOut]
    = transferSourceOneRoute(desOneRoute.routeIndex, desOneRoute.amountOut);

  // Destination split route
  const desSplitRoute = await desQueryContract.splitTwoRoutes(
    desConfig.StableToken, tokenOut, _totalAmountOut, ROUTES, DISTRIBUTION_PERCENT);

  const [desSplitRouteData, desSplitRouteAmount, desSplitRouteNetAmountOut]
    = transferSourceSplitRoute(
      desSplitRoute.routeIndexs, desSplitRoute.volumns, desSplitRoute.amountOut);

  if (parseFloat(desOneRouteAmountOut) < parseFloat(desSplitRouteNetAmountOut)) {
    data["destination"] = {
      "amount": desSplitRouteAmount,
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