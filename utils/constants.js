const bestRouteQueryABI = require("../abis/mdexBestRouteQueryABI.json");

module.exports = {
  DECIMALS: 18,
  DISTRIBUTION_PERCENT: 5,
  SWAP_FEE: 1,
  ROUTING_CONTRACTS: {
    4: {
      Lable: "Rinkeby Testnet Network",
      SwapRoute: [3, 5],
      DexConfig: {
        3: { name: "Uniswap", fee: 0.3 },
        5: { name: "Curve Fi.", fee: 0.04 }
      },
      ABIBestRouteQuery: bestRouteQueryABI,
      MultisigWallet: "0x33DcB383153bD106931911A4D81ac0DA719412B4",
      AddressBestRouteQuery: "0x92CA3294eB72b212e53Eb4b900d0D691f9cd4F4d",
      StableToken: "0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9"
    },
    5: {
      Lable: "Goerli Testnet Network",
      SwapRoute: [4, 5],
      DexConfig: {
        4: { name: "Curve Fi.", fee: 0.04 },
        5: { name: "Uniswap", fee: 0.3 }
      },
      ABIBestRouteQuery: bestRouteQueryABI,
      MultisigWallet: "0x0b88D6D0c00a4399FA73B903E627Ec16e926eC53",
      AddressBestRouteQuery: "0xd19C6F58B9D06C0C3198993Ee9C34C08BA57195e",
      StableToken: "0x26FE8a8f86511d678d031a022E48FfF41c6a3e3b"
    },
  },
};