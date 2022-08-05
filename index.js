const express = require("express");
const ethers = require("ethers");
const Decimal = require('decimal.js');
const app = express();

// Cron job
require("./services/cron-jobs");

// Express Configs
require('./configs/express')(app)

const { ROUTING_CONTRACTS, DECIMALS } = require("./utils/constants");
const { getSwapRate, calAmountWithRoundUp, getServiceFee } = require("./services/swap.service");

let port = process.env.PORT || 9000;

app.get("/rate", async (req, res) => {
  const tokenIn = req.query.tokenIn;
  const tokenOut = req.query.tokenOut;
  const amountIn = req.query.amount;
  const chainId = req.query.chainId;

  const ethAmountIn = ethers.utils.formatEther(amountIn, DECIMALS);
  const serviceFee = getServiceFee(ethAmountIn);
  const amountInWithFee = new Decimal(ethAmountIn).sub(serviceFee);

  const weiServiceFee = ethers.utils.parseUnits(
    new Decimal(serviceFee).toFixed(DECIMALS), DECIMALS);

  const weiAmountIn = ethers.utils.parseUnits(
    new Decimal(amountInWithFee).toFixed(DECIMALS), DECIMALS);

  const { oneRouteResult, splitRouteResult } = await getSwapRate(
    chainId, weiAmountIn, tokenIn, tokenOut);

  // Prepare return data
  let data = {};

  // Define service fee
  data["fee"] = weiServiceFee.toString();

  if (oneRouteResult.totalAmount < splitRouteResult.totalAmount &&
    splitRouteResult.splitRouteData.length >= 2) {

    data["amount"] = splitRouteResult.splitRouteAmountOut
    data["isSplitSwap"] = true
    data["route"] = splitRouteResult.splitRouteData
  } else {
    data["amount"] = oneRouteResult.oneRouteAmountOut
    data["isSplitSwap"] = false
    data["route"] = oneRouteResult.oneRouteData
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

  // SOURCE: Query pair of tokenIn - stableToken
  const ethAmountIn = ethers.utils.formatEther(amountIn, DECIMALS);
  const serviceFee = getServiceFee(ethAmountIn);
  const amountInWithFee = new Decimal(ethAmountIn).sub(serviceFee);

  const weiServiceFee = ethers.utils.parseUnits(
    new Decimal(serviceFee).toFixed(DECIMALS), DECIMALS);

  const weiAmountIn = ethers.utils.parseUnits(
    new Decimal(amountInWithFee).toFixed(DECIMALS), DECIMALS);

  const sourceConfig = ROUTING_CONTRACTS[sourceChainId];

  const { oneRouteResult, splitRouteResult } = await getSwapRate(
    sourceChainId, weiAmountIn, tokenIn, sourceConfig.StableToken);

  let totalAmountOut = 0;
  let data = {};

  data["fee"] = weiServiceFee.toString();

  if (oneRouteResult.totalAmount < splitRouteResult.totalAmount &&
    splitRouteResult.splitRouteData.length >= 2) {

    totalAmountOut = splitRouteResult.totalAmount;

    data["source"] = {
      "amount": splitRouteResult.splitRouteAmountOut,
      "chainId": sourceChainId,
      "isSplitSwap": true,
      "route": splitRouteResult.splitRouteData
    }
  } else {
    totalAmountOut = oneRouteResult.totalAmount;

    data["source"] = {
      "amount": oneRouteResult.oneRouteAmountOut,
      "chainId": sourceChainId,
      "isSplitSwap": false,
      "route": oneRouteResult.oneRouteData
    }
  }

  // DESTINATION: Query pair of stableToken - tokenOut
  const desConfig = ROUTING_CONTRACTS[destinationChainId];

  const amountWithRoundup = await calAmountWithRoundUp(totalAmountOut);

  // Need to pass BigNumber
  const swapResult = await getSwapRate(   // !!! Need review code here !!!!
    destinationChainId, amountWithRoundup, desConfig.StableToken, tokenOut);

  const desOneRouteResult = swapResult.oneRouteResult;
  const desSplitRouteResult = swapResult.splitRouteResult;

  if (desOneRouteResult.totalAmount < desSplitRouteResult.totalAmount) {
    data["destination"] = {
      "amount": desSplitRouteResult.splitRouteAmountOut,
      "chainId": destinationChainId,
      "isSplitSwap": true,
      "route": desSplitRouteResult.splitRouteData
    }
  } else {
    data["destination"] = {
      "amount": desOneRouteResult.oneRouteAmountOut,
      "chainId": destinationChainId,
      "isSplitSwap": false,
      "route": desOneRouteResult.oneRouteData
    }
  }

  res.send(data);
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})