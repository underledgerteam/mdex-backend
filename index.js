const express = require("express");
const ethers = require("ethers");
const Decimal = require('decimal.js');
const app = express();

// Cron job
require("./services/cron-jobs.service");

// Express Configs
require('./configs/express')(app)

const { ROUTING_CONTRACTS, DECIMALS } = require("./utils/constants");
const { getSwapRate, getServiceFee, validateAmoutOut } = require("./services/swap.service");
const { validateSchema } = require("./middleware/validateSchema");
const { swapOneChainSchema, swapCrossChainSchema } = require("./schema/swap.schema")

let port = process.env.PORT || 9000;

app.head("/health-check", (req, res) => {
  console.log("Health check connection sucessful.")
  res.success()
}); 

app.get("/rate", swapOneChainSchema, validateSchema, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amount: amountIn, chainId } = req.query;

    const ethAmountIn = ethers.utils.formatEther(amountIn, DECIMALS);
    const serviceFee = getServiceFee(ethAmountIn);
    const amountInWithFee = new Decimal(ethAmountIn).sub(serviceFee);

    const weiServiceFee = ethers.utils.parseUnits(
      new Decimal(serviceFee).toFixed(DECIMALS), DECIMALS);

    const weiAmountIn = ethers.utils.parseUnits(
      new Decimal(amountInWithFee).toFixed(DECIMALS), DECIMALS);

    const { oneRouteResult, splitRouteResult } = await getSwapRate(
      chainId, weiAmountIn, tokenIn, tokenOut);

    let data = {};

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

    const isAmountOutValid = validateAmoutOut(data["amount"]);
    if (!isAmountOutValid) {
      return res.error("SWAP001");
    }

    res.success(data)
  } catch (err) {
    console.log(err);
    res.error(err.code, err.message);
  }
});


app.get("/cross-rate", swapCrossChainSchema, validateSchema, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amount: amountIn, sourceChainId, destinationChainId } = req.query;

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

    // Is amount out from split route more than one route
    const isLessthanOneRoute = new Decimal(oneRouteResult.totalAmount
    ).lessThan(splitRouteResult.totalAmount);

    if (isLessthanOneRoute && splitRouteResult.splitRouteData.length >= 2) {
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

    const isAmountOutValid = validateAmoutOut(data["source"]["amount"]);
    if (!isAmountOutValid) {
      return res.error("SWAP001");
    }

    // DESTINATION: Query pair of stableToken - tokenOut
    const desConfig = ROUTING_CONTRACTS[destinationChainId];

    const {
      oneRouteResult: desOneRouteResult,
      splitRouteResult: desSplitRouteResult
    } = await getSwapRate(
      destinationChainId, totalAmountOut, desConfig.StableToken, tokenOut);

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

    res.success(data)
  } catch (err) {
    console.log(err);
    res.error(err.code, err.message);
  }
});


app.listen(port, () => {
  console.log(`Listening on port ${port}`);
})