const controllerABI = require("../abis/mdexControllerABI.json");
const bestRouteQueryABI = require("../abis/mdexBestRouteQueryABI.json");

module.exports = {
  DISTRIBUTION_PERCENT: 5,
  SWAP_FEE: 1,
  ROUTES: [0, 1],

  ROUTING_NAME: {
    0: "Uniswap",
    1: "Curve Fi.",
  },

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

      ABIController: controllerABI,
      ABIBestRouteQuery: bestRouteQueryABI,

      MultisigWallet: "0x2A5e8342EEcD3DCD22D4720A6f3B7dDFCA129868",
      AddressController: "0x8207ef2260e98b5Ae3aF0419c22c5a76e9267De2",
      AddressBestRouteQuery: "0x92CA3294eB72b212e53Eb4b900d0D691f9cd4F4d",
    },
    5: {
      Lable: "Goerli Testnet Network",

      ABIController: controllerABI,
      ABIBestRouteQuery: bestRouteQueryABI,

      MultisigWallet: "0x5D9b61B62D27E310FE8679a76d27a558bD0E016D",
      AddressController: "0xe2e0DfA2dC80d847F6B6B9D67FE0fDa07B10EE5a",
      AddressBestRouteQuery: "0xd19C6F58B9D06C0C3198993Ee9C34C08BA57195e",
    },
  },
};
