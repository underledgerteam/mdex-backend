const functions = require("firebase-functions");
const express = require("express");
const decimal = require('decimal.js');
const ethers = require("ethers");

const { validateSchema } = require("./middleware/validateSchema");
const { ROUTING_CONTRACTS, DECIMALS } = require("./utils/constants");
const { swapOneChainSchema, swapCrossChainSchema } = require("./schema/swap.schema")
const { getSwapRate, getServiceFee, validateAmoutOut } = require("./services/swap.service");

const app = express();

require("./services/cron-jobs.service"); // cronjob
require('./configs/express')(app);       // express config

app.get('/home', (req, res) => {
  res.success("Hello from express app inside firebase cloud function");
})

app.head("/health-check", (req, res) => {
  console.log("Health check connection sucessful.")
  res.success()
});

app.get("/rate", swapOneChainSchema, validateSchema, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amount: amountIn, chainId } = req.query;

    const ethAmountIn = ethers.utils.formatEther(amountIn, DECIMALS);
    const serviceFee = getServiceFee(ethAmountIn);
    const amountInWithFee = new decimal(ethAmountIn).sub(serviceFee);

    const weiServiceFee = ethers.utils.parseUnits(
      new decimal(serviceFee).toFixed(DECIMALS), DECIMALS);

    const weiAmountIn = ethers.utils.parseUnits(
      new decimal(amountInWithFee).toFixed(DECIMALS), DECIMALS);

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
    const amountInWithFee = new decimal(ethAmountIn).sub(serviceFee);

    const weiServiceFee = ethers.utils.parseUnits(
      new decimal(serviceFee).toFixed(DECIMALS), DECIMALS);

    const weiAmountIn = ethers.utils.parseUnits(
      new decimal(amountInWithFee).toFixed(DECIMALS), DECIMALS);

    const sourceConfig = ROUTING_CONTRACTS[sourceChainId];

    const { oneRouteResult, splitRouteResult } = await getSwapRate(
      sourceChainId, weiAmountIn, tokenIn, sourceConfig.StableToken);

    let totalAmountOut = 0;
    let data = {};

    data["fee"] = weiServiceFee.toString();

    const isLessthanOneRoute = new decimal(oneRouteResult.totalAmount
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

exports.app = functions.https.onRequest(app);