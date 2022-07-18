require("dotenv").config();

const ethers = require("ethers");
const assert = require("assert");

const { PRIVATE_KEY } = process.env;
const {
  DISTRIBUTION_PERCENT,
  MAX_ROUTE,
  ROUTES,
  SWAP_FEE,
  ROUTING_CONTRACTS
} = require("../utils/constants");

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
    return [indexRoute.toNumber(), amountOutRoute.toNumber()]
  },

  _getSplitRoutes(data) {
    [indexRotes, volumeRoute, amountOut] = data;

    amountOut = amountOut.toNumber();

    for (i = 0; i < indexRotes.length; i++) {
      indexRotes[i] = indexRotes[i].toNumber();
      volumeRoute[i] = volumeRoute[i].toNumber();
    }

    return [indexRotes, volumeRoute, amountOut]
  },

  getBestRate(tokenIn, tokenOut, amount, chainId) {
    return new Promise(async (resolve, reject) => {
      try {
        let data = {};
        let isSplitSwap = false;

        const wallet = await this.signedWallet(chainId);
        
        const routingConfig = ROUTING_CONTRACTS[chainId];
        const serviceFee = await this.getServiceFee(amount);

        const netAmount = amount - serviceFee;

        const queryContract = new ethers.Contract(
          routingConfig.AddressBestRouteQuery, routingConfig.ABIBestRouteQuery, wallet);

        const oneRoute = await queryContract.oneRoute(tokenIn, tokenOut, netAmount, ROUTES);
        const splitRoutes = await queryContract.splitTwoRoutes(tokenIn, tokenOut,
          netAmount, ROUTES, DISTRIBUTION_PERCENT);
        
        const [indexOneRoute, amountOutOneRoute] = await this._getOneRoute(oneRoute);
        const [
          indexSplitRoute,
          volumesSplitRoute,
          amountOutsplitRoute
        ] = await this._getSplitRoutes(splitRoutes);

        if (amountOutOneRoute < amountOutsplitRoute) {
          isSplitSwap = true;
        }

        data["fee"] = serviceFee;
        data["isSplitSwap"] = isSplitSwap;

        if (isSplitSwap) {
            data["route"] = indexSplitRoute;
            data["amount"] = volumesSplitRoute;
        } else {
          data["route"] = indexOneRoute;
          data["amount"] = amountOutOneRoute;
        }
    
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  },

  swap(tokenIn, tokenOut, chainId, isSplitSwap, tradingAmount, tradingRouteIndex) {
    return new Promise(async (resolve, reject) => {
      try {
        // validate input
        if (isSplitSwap) {
          assert(tradingAmount.length == MAX_ROUTE, "Trading amounts invalid length");
          assert(tradingRouteIndex.length == MAX_ROUTE, "Trading routes index invalid length");
        } else {
          assert(tradingAmount.length == 1, "Trading amounts can have only 1 length");
          assert(tradingAmount.length == 1, "Trading routes index can have only 1 length");
        }

        const wallet = await this.signedWallet(chainId);
        const routingConfig = ROUTING_CONTRACTS[chainId];

        const controllerContract = new ethers.Contract(routingConfig.AddressController,
          routingConfig.ABIController, wallet);

        if (!isSplitSwap) {
          await controllerContract.swap(tokenIn, tokenOut, tradingAmount[0], tradingRouteIndex[0]);
        } else {
          await controllerContract.spiltSwap(
            tokenIn,
            tokenOut,
            amount,
            tradingRouteIndex,
            tradingAmount
          );
        }

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

}

module.exports = { ...methods }