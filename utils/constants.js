const bestRouteQueryABI = require("../abis/mdexBestRouteQueryABI.json");

module.exports = {
  DECIMALS: 18,
  DISTRIBUTION_PERCENT: 5,
  SWAP_FEE: 1,
  ROUTES: [0, 1],
  DEX: {
    0: {
      name: "Uniswap",
      fee: 0.3,
    },
    1: {
      name: "Curve Fi.",
      fee: 0.04,
    },
  },
  ROUTING_CONTRACTS: {
    4: {
      Lable: "Rinkeby Testnet Network",

      ABIBestRouteQuery: bestRouteQueryABI,

      MultisigWallet: "0x2A5e8342EEcD3DCD22D4720A6f3B7dDFCA129868",
      AddressBestRouteQuery: "0x92CA3294eB72b212e53Eb4b900d0D691f9cd4F4d",
      StableToken: "0x3FFc03F05D1869f493c7dbf913E636C6280e0ff9"
    },
    5: {
      Lable: "Goerli Testnet Network",

      ABIBestRouteQuery: bestRouteQueryABI,

      MultisigWallet: "0x5D9b61B62D27E310FE8679a76d27a558bD0E016D",
      AddressBestRouteQuery: "0xd19C6F58B9D06C0C3198993Ee9C34C08BA57195e",
      StableToken: "0x26FE8a8f86511d678d031a022E48FfF41c6a3e3b"
    },
  },
};