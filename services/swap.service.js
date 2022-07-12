// const Web3 = require('web3');
const ethers = require("ethers");

const appConfig = require('../configs/app');
const web3Config = require('../configs/web3');

const uniswapConfig = require('../configs/amm-uniswap');

const methods = {
  signedWallet(chainId) {
    return new Promise(async (resolve, reject) => {
      try {
        const network = ethers.providers.getNetwork(parseInt(chainId));
        const provider = ethers.getDefaultProvider(network);
        const wallet = new ethers.Wallet(web3Config.privateKey, provider);

        resolve(wallet); 
      } catch (error) {
        reject(error);
      }
    });
  },

  calculatePriceImpact(amount, reserveToken) {
    return  amount / (reserveToken + amount);
  },

  getAllRoutes(tokenIn, tokenOut, chainId) {
    return new Promise(async (resolve, reject) => {
      try {
        let routes = [];

        const wallet = await this.signedWallet(chainId);

        const factoryContract = new ethers.Contract(
          uniswapConfig.rinkebyUniswapFactoryContract,
          uniswapConfig.uniswapFactoryABI,
          wallet
        );
    
        const uniswapPossibleRoute = await factoryContract.getPair(tokenIn, tokenOut);
        routes.push(uniswapPossibleRoute);
        
        resolve(routes);
      } catch (error) {
        reject(error);
      }
    });
  },

  qoute(tokenIn, tokenOut, amountIn, chainId) {
    return new Promise(async (resolve, reject) => {
      try {
        let allQoutes = {};

        const wallet = await this.signedWallet(chainId);
        const possibleRoutes = await this.getAllRoutes(tokenIn, tokenOut, chainId);

        // prepare router contract
        const routerContract = new ethers.Contract(
          uniswapConfig.rinkebyUniswapRouterContract,
          uniswapConfig.uniswapRouteABI,
          wallet
        );
        
        for (let i = 0; i < possibleRoutes.length; i++) {
          const pairAddress = possibleRoutes[i];

          const pairContract = new ethers.Contract(pairAddress, uniswapConfig.uniswapPairABI, wallet);
          const [reserveToken0, reserveToken1] = await pairContract.getReserves();

          // const priceImpact = await this.calculatePriceImpact(amountIn, reserveToken0.toNumber());
          const amountOut = await routerContract.getAmountOut(amountIn, reserveToken0, reserveToken1);

          allQoutes[pairAddress] = amountOut;
        }

        // order by amountOut ASC
        const sortQoutes = Object.fromEntries(
          Object.entries(allQoutes).sort(([, a], [, b]) => a - b)
        );

        pairAddress = Object.keys(sortQoutes)[0];
        amountOut = Object.values(sortQoutes)[0].toNumber();

        var data = {
          tokenIn: tokenIn,
          tokenInAmount: amountIn,
          tokenOut: tokenOut,
          tokenOutAmount: amountOut,
          routes: [
            [pairAddress, amountOut]
          ]
        }

        resolve(JSON.stringify(data));    
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = { ...methods }