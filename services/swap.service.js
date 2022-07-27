require("dotenv").config();
const ethers = require("ethers");
const { 
  SWAP_FEE,
  ROUTING_NAME,
  DEX
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

  _getOneRoute(data) {
    [indexRoute, amountOutRoute] = data;

    oneRouteIndex = {};
    index = indexRoute.toNumber()

    dexFee = (amountOutRoute.toString() * DEX[index]["fee"]) / 100;
    totalAmountOut = amountOutRoute.toString() - dexFee;

    oneRouteIndex["index"] = index;
    oneRouteIndex["name"] = ROUTING_NAME[index];
    oneRouteIndex["fee"] = dexFee;

    return [[oneRouteIndex], totalAmountOut.toString()]
  },

  _getSplitRoutes(data) {
    [indexRotes, volumeRoute, amountOut] = data;
    
    splitRouteIndex = [];
    splitRouteVolume = [];

    dexFee = (amountOut.toString() * DEX[index]["fee"]) / 100;
    totalAmountOut = amountOut.toString() - dexFee;

    for (i = 0; i < indexRotes.length; i++) {
      index = indexRotes[i].toString();

      splitRouteVolume.push(volumeRoute[i].toString());
      splitRouteIndex.push({
        "index": index,
        "name": ROUTING_NAME[index],
        "fee": dexFee
      });
    }

    return [splitRouteIndex, splitRouteVolume, totalAmountOut.toString()]
  },

  calculateSplitAmountOut(percents, amount) {
    let splitAmountOuts = [];

    for (i = 0; i < percents.length; i++) {
      splitAmountOuts.push((amount * percents[i]) / 100);
    }

    return splitAmountOuts;
  }
}

module.exports = { ...methods }