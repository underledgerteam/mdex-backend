const Web3 = require('web3');

const appConfig = require('../configs/app');
const web3Config = require('../configs/web3');
const uniswapConfig = require('../configs/amm-uniswap');


const methods = {
    getPair(token0, token1) {
        return new Promise(async (resolve, reject) => {
            try {
                const web3 = new Web3(new Web3.providers.HttpProvider(web3Config.ethHttpProvider));
                const networkId = await web3.eth.net.getId();

                const tx = uniswapFactoryContract.methods.getPair(token0, token1);

                const gas = tx.estimateGas({from: web3Config.defaultAccountAddress});
                const gasPrice = await web3.eth.getGasPrice();

                const data = tx.encodeABI();
                const nonce = await web3.eth.getTransactionCount(web3Config.defaultAccountAddress)

                const signedTx = await web3.eth.accounts.signTransaction(
                    {
                        to: uniswapConfig.ropstenUniswapFactoryContract,
                        data,
                        gas,
                        gasPrice,
                        nonce,
                        chainId: networkId
                    },
                    defaultPK
                );

                const pair = await web3.eth.sendTransaction(signedTx.rawTransaction);

                console.log('Transaction Hash:', pair.transactionHash);
                console.log('Pair:', pair);

                resolve(pair);
            } catch (error) {
                reject(error)
            }
        });
    }
}

module.exports = { ...methods }