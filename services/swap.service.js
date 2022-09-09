const ethers = require("ethers");
const Decimal = require('decimal.js');
const {
  SWAP_FEE,
  ROUTING_CONTRACTS,
  DISTRIBUTION_PERCENT
} = require("../utils/constants");

require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const signedWallet = async (chainId) => {
  try {
    const httpProvider = ROUTING_CONTRACTS[chainId]["HttpProvider"];
    const provider = new ethers.providers.JsonRpcProvider(httpProvider)

    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    return wallet;
  } catch (error) {
    return error;
  }
}

const getServiceFee = (amount) => {
  return new Decimal(amount).mul(SWAP_FEE).div(100);
}

const getPoolFee = (fee, amount) => {
  return new Decimal(amount).mul(fee).div(100);
}

const getConnextSlippage = (amount) => {
  return new Decimal(amount).div(100).mul(97);
}

const getAmountByVloume = (volume, amount) => {
  return new Decimal(amount).mul(volume).div(100).toFixed();
}

const calAmountWithRoundUp = (amount) => {
  Decimal.rounding = Decimal.ROUND_UP;
  return new Decimal(amount).round().toFixed();
}

const validateAmoutOut = (amount) => {
  if (amount <= 0) return false
  else return true
}

const getDexConfigByRouteIndex = (chainId, routeIndex) => {
  try {
    const dexRouteConfig = ROUTING_CONTRACTS[chainId]["DexConfig"][routeIndex];

    const dexFee = dexRouteConfig["fee"];
    const dexName = dexRouteConfig["name"];

    return { dexFee, dexName }
  } catch (error) {
    return error;
  }
}

const transformSourceOneRoute = async (chainId, routeIndex, amountIn, amountOut) => {
  const oneRouteData = [];
  const oneRouteAmountOut = [];

  const indexRoute = routeIndex.toNumber();
  const _amountOut = amountOut.toString();
  const _amountIn = amountIn.toString();

  const dexConfig = getDexConfigByRouteIndex(chainId, indexRoute);

  const poolFee = getPoolFee(dexConfig.dexFee, _amountIn);
  const poolFeeWithRoundUp = await calAmountWithRoundUp(poolFee);

  const totalAmount = _amountOut;

  oneRouteAmountOut.push(totalAmount);
  oneRouteData.push({
    "fee": poolFeeWithRoundUp,
    "index": indexRoute,
    "name": dexConfig.dexName
  });

  return { oneRouteData, oneRouteAmountOut, totalAmount }
}

const transformSourceSplitRoute = async (chainId, routeIndexs, volumes, amountIn, amountOut) => {
  let totalAmount = 0;
  let splitRouteData = [];
  let splitRouteAmountOut = [];

  for (i = 0; i < routeIndexs.length; i++) {
    // Prevent operation error by 0 value
    if (volumes[i] > 0) {
      const indexRoute = routeIndexs[i].toNumber();
      
      const dexConfig = getDexConfigByRouteIndex(chainId, indexRoute);

      // Convert bignumber to string for decimal operation
      const _amountOut = amountOut.toString();
      const _amountIn = amountIn.toString();
      const _volume = volumes[i].toString();
    
      const poolFee = getPoolFee(dexConfig.dexFee, _amountIn);
      const poolFeeWithRoundUp = calAmountWithRoundUp(poolFee);

      const amountByVolume = getAmountByVloume(_volume, _amountIn);

      splitRouteAmountOut.push(amountByVolume);

      // Update total amount to find Net amount
      // totalAmount = new Decimal(totalAmount).add(amountByVolume).toFixed();
      totalAmount = _amountOut;

      splitRouteData.push({
        "fee": poolFeeWithRoundUp,
        "index": indexRoute,
        "name": dexConfig.dexName
      });
    }
  }

  return { splitRouteData, splitRouteAmountOut, totalAmount }
}

const getSwapRate = async (chainId, amount, sourceToken, destinationToken) => {
  const contractConfig = ROUTING_CONTRACTS[chainId];
  const signer = await signedWallet(chainId);
  const queryContract = new ethers.Contract(
    contractConfig.AddressBestRouteQuery,
    contractConfig.ABIBestRouteQuery,
    signer
  );

  const swapRoutes = Object.keys(contractConfig["DexConfig"]);

  const [oneRoute, splitRoutes] = await Promise.all([
    queryContract.oneRoute(sourceToken, destinationToken, amount, swapRoutes),
    queryContract.splitTwoRoutes(
      sourceToken, destinationToken, amount, swapRoutes, DISTRIBUTION_PERCENT)
  ])

  const oneRouteResult = await transformSourceOneRoute(
    chainId,
    oneRoute.routeIndex,
    amount,
    oneRoute.amountOut
  );
  const splitRouteResult = await transformSourceSplitRoute(
    chainId,
    splitRoutes.routeIndexs,
    splitRoutes.volumns,
    amount,
    splitRoutes.amountOut
  );

  return { oneRouteResult, splitRouteResult };
}

module.exports = {
  signedWallet,
  getSwapRate,
  transformSourceOneRoute,
  transformSourceSplitRoute,
  calAmountWithRoundUp,
  getServiceFee,
  validateAmoutOut,
  getConnextSlippage
}