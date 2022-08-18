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
    const network = ethers.providers.getNetwork(parseInt(chainId));
    const provider = ethers.getDefaultProvider(network);
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

const getAmountByVloume = (volume, amount) => {
  return new Decimal(amount).mul(volume).div(100).toFixed();
}

const getAmountWithOutFee = (fee, amount) => {
  return new Decimal(amount).sub(fee).toFixed();
}

const calAmountWithRoundUp = (amount) => {
  Decimal.rounding = Decimal.ROUND_UP;
  return new Decimal(amount).round().toFixed();
}

const transformSourceOneRoute = async (chainId, routeIndex, amountOut) => {
  const oneRouteData = [];
  const oneRouteAmountOut = [];

  const indexRoute = routeIndex.toNumber();
  const _amountOut = amountOut.toString();

  const dexRouteConfig = ROUTING_CONTRACTS[chainId]["DexConfig"][indexRoute];
  const dexRouteFee = dexRouteConfig["fee"];
  const dexRouteName = dexRouteConfig["name"];

  const poolFee = getPoolFee(dexRouteFee, _amountOut);
  const poolFeeWithRoundUp = await calAmountWithRoundUp(poolFee);

  const totalAmount = getAmountWithOutFee(poolFeeWithRoundUp, _amountOut);

  oneRouteAmountOut.push(totalAmount);
  oneRouteData.push({
    "fee": poolFeeWithRoundUp,
    "index": indexRoute,
    "name": dexRouteName
  });

  return { oneRouteData, oneRouteAmountOut, totalAmount }
}

const transformSourceSplitRoute = async (chainId, routeIndexs, volumes, amountOut) => {
  let totalAmount = 0;
  let splitRouteData = [];
  let splitRouteAmountOut = [];

  for (i = 0; i < routeIndexs.length; i++) {
    // Prevent operation error by 0 value
    if (volumes[i] > 0) {
      const indexRoute = routeIndexs[i].toNumber();
      
      const dexRouteConfig = ROUTING_CONTRACTS[chainId]["DexConfig"][indexRoute];
      const dexRouteFee = dexRouteConfig["fee"];
      const dexRouteName = dexRouteConfig["name"];

      // Convert bignumber to string for decimal operation
      const _amountOut = amountOut.toString();
      const _volume = volumes[i].toString();
      
      const poolFee = getPoolFee(dexRouteFee, _amountOut);
      const poolFeeWithRoundUp = calAmountWithRoundUp(poolFee);

      const amountByVolume = getAmountByVloume(_volume, _amountOut);
      const amountWithoutFee = getAmountWithOutFee(poolFeeWithRoundUp, amountByVolume);
      
      splitRouteAmountOut.push(amountWithoutFee);
      
      // Update total amount to find Net amount
      totalAmount = new Decimal(totalAmount).add(amountWithoutFee).toFixed();
      
      splitRouteData.push({
        "fee": poolFeeWithRoundUp,
        "index": indexRoute,
        "name": dexRouteName
      });
    }
  }

  return { splitRouteData, splitRouteAmountOut, totalAmount }
}

const getSwapRate = async (chainId, amount, sourceToken, destinationToken) => {
  // prepare contract
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
    oneRoute.amountOut
  );
  const splitRouteResult = await transformSourceSplitRoute(
    chainId,
    splitRoutes.routeIndexs,
    splitRoutes.volumns,
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
  getServiceFee
}