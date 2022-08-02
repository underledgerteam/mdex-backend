require("dotenv").config();
const ethers = require("ethers");
const { 
  SWAP_FEE,
  ROUTING_NAME,
  DEX,
  DECIMALS
} = require("../utils/constants");

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const methods = {
  signedWallet(chainId) {
    return new Promise(async (resolve, reject) => {
      try {
        const network = ethers.providers.getNetwork(parseInt(chainId));
        const provider = ethers.getDefaultProvider(network);
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

        resolve(wallet);
      } catch (error) {
        reject(error);
      }
    });
  },

  getServiceFee(amount) {
    return (amount * SWAP_FEE) / 100;
  },

  transferSourceOneRoute(routeIndex, amountOut) {
    const _routeIndex = routeIndex.toNumber();

    const poolFee = (amountOut * DEX[routeIndex]["fee"]) / 100;
    const amountWithFee = amountOut - poolFee;
    
    const routeName = ROUTING_NAME[_routeIndex];

    const sourceOneRouteData = {
      "fee": poolFee,
      "index": _routeIndex,
      "name": routeName
    }

    return [sourceOneRouteData, amountWithFee]
  },

  transferSourceSplitRoute(routeIndexs, volumes, amountOut) {
    const sourceSplitRouteData = [];
    const sourceSplitRouteAmount = [];

    const _amountOut = amountOut.toString();

    for (i = 0; i < routeIndexs.length; i++) {
      if (volumes[i] > 0) {
        let _routeIndex = routeIndexs[i].toNumber();
        let routeName = ROUTING_NAME[_routeIndex];

        poolFee = (_amountOut * DEX[_routeIndex]["fee"]) / 100;
        amountWithFee = ((_amountOut * volumes[i].toString()) / 100) - poolFee;
        sourceSplitRouteAmount.push(amountWithFee);

        sourceSplitRouteData.push({
          "fee": poolFee,
          "index": _routeIndex,
          "name": routeName,
        });
      }
    }
    
    totalAmount = sourceSplitRouteAmount.reduce((a, b) => a + b, 0);
    
    return [sourceSplitRouteData, sourceSplitRouteAmount, totalAmount]
  }
}

module.exports = { ...methods }